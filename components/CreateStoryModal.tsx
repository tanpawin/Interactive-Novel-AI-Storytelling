'use client';

import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  CreateStoryFormData,
  Genre,
  NarrativeTone,
  StoryLength,
} from '../types/story';

import '../styles/modal.css';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES: Genre[] = [
  'แฟนตาซี',
  'โรแมนติก',
  'สืบสวนสอบสวน',
  'ไซไฟ',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'ผจญภัย',
  'วรรณกรรม',
];

const TONES: NarrativeTone[] = [
  'มืดมนและสมจริง',
  'สดใสและจินตนาการ',
  'โรแมนติก',
  'ปรัชญา',
  'ตลกขบขัน',
  'ระทึกขวัญ',
];

const LENGTHS: {
  label: StoryLength;
  desc: string;
}[] = [
  {
    label: 'เรื่องสั้น',
    desc: '~5 บท',
  },
  {
    label: 'นวนิยายขนาดกลาง',
    desc: '~15 บท',
  },
  {
    label: 'นวนิยายยาว',
    desc: '~30+ บท',
  },
];

const DEFAULT_FORM_DATA: CreateStoryFormData = {
  title: '',
  corePremise: '',
  genre: 'แฟนตาซี',
  tone: 'มืดมนและสมจริง',
  length: 'นวนิยายขนาดกลาง',
  protagonist: '',
  worldSetting: '',
};

const DRAFT_KEY =
  'cozytales_create_story_draft';

export const CreateStoryModal: React.FC<
  CreateStoryModalProps
> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const [step, setStep] =
    useState<1 | 2 | 3>(1);

  const [formData, setFormData] =
    useState<CreateStoryFormData>(
      DEFAULT_FORM_DATA
    );

  const [coverImageUrl, setCoverImageUrl] =
    useState('');

  const [coverPreview, setCoverPreview] =
    useState('');

  const [isUploadingCover, setIsUploadingCover] =
    useState(false);

  const [coverError, setCoverError] =
    useState('');

  const [isRestoringDraft, setIsRestoringDraft] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // ==========================================
  // RESTORE DRAFT
  // ==========================================
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const savedDraft =
      sessionStorage.getItem(DRAFT_KEY);

    if (!savedDraft) {
      setIsRestoringDraft(false);
      return;
    }

    try {
      const data = JSON.parse(savedDraft);

      setFormData({
        title:
          data.title || '',
        corePremise:
          data.corePremise || '',
        genre:
          data.genre || 'แฟนตาซี',
        tone:
          data.tone ||
          'มืดมนและสมจริง',
        length:
          data.length ||
          'นวนิยายขนาดกลาง',
        protagonist:
          data.protagonist || '',
        worldSetting:
          data.worldSetting || '',
      });

      if (data.coverImageUrl) {
        setCoverImageUrl(
          data.coverImageUrl
        );

        setCoverPreview(
          data.coverImageUrl
        );
      }

      if (
        data.step === 1 ||
        data.step === 2 ||
        data.step === 3
      ) {
        setStep(data.step);
      }
    } catch (error) {
      console.error(
        'Restore draft error:',
        error
      );
    } finally {
      setIsRestoringDraft(false);
    }
  }, [isOpen]);

  // ==========================================
  // AUTO SAVE DRAFT
  // ==========================================
  useEffect(() => {
    if (
      !isOpen ||
      isRestoringDraft
    ) {
      return;
    }

    try {
      const draft = {
        ...formData,
        coverImageUrl,
        step,
      };

      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.error(
        'Save draft error:',
        error
      );
    }
  }, [
    formData,
    coverImageUrl,
    step,
    isOpen,
    isRestoringDraft,
  ]);

  // ==========================================
  // UPDATE FORM
  // ==========================================
  const updateFormData = (
    changes: Partial<CreateStoryFormData>
  ) => {
    setFormData((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  // ==========================================
  // SAVE DRAFT IMMEDIATELY
  // ==========================================
  const saveDraftNow = (
    extraCoverUrl?: string
  ) => {
    try {
      const draft = {
        ...formData,
        coverImageUrl:
          extraCoverUrl ??
          coverImageUrl,
        step,
      };

      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.error(
        'Immediate draft save error:',
        error
      );
    }
  };

  // ==========================================
  // NEXT
  // ==========================================
  const handleNext = (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (step === 1) {
      if (
        !formData.corePremise.trim()
      ) {
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
    }
  };

  // ==========================================
  // BACK
  // ==========================================
  const handleBack = (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(1);
    }
  };

  // ==========================================
  // CLOSE
  // ==========================================
  const handleClose = (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    sessionStorage.removeItem(
      DRAFT_KEY
    );

    setStep(1);

    setFormData(
      DEFAULT_FORM_DATA
    );

    setCoverImageUrl('');
    setCoverPreview('');
    setCoverError('');
    setIsUploadingCover(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    onClose();
  };

  // ==========================================
  // COVER UPLOAD
  // ==========================================
  const handleCoverChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    // สำคัญ:
    // ป้องกัน event จาก input
    // ไม่ให้ไปทำงานกับ parent
    e.stopPropagation();

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    setCoverError('');

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setCoverError(
        'รองรับเฉพาะไฟล์ JPG, PNG และ WEBP'
      );

      e.target.value = '';

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setCoverError(
        'ขนาดไฟล์ต้องไม่เกิน 5 MB'
      );

      e.target.value = '';

      return;
    }

    // ========================================
    // บันทึกข้อมูลก่อน Upload
    // ========================================
    saveDraftNow();

    // ========================================
    // PREVIEW
    // ========================================
    const previewUrl =
      URL.createObjectURL(file);

    setCoverPreview(
      previewUrl
    );

    setIsUploadingCover(true);

    try {
      const uploadData =
        new FormData();

      uploadData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/upload-cover',
          {
            method: 'POST',
            body: uploadData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            'ไม่สามารถอัปโหลดหน้าปกได้'
        );
      }

      // ======================================
      // URL จาก Supabase Storage
      // ======================================
      setCoverImageUrl(
        data.url
      );

      setCoverPreview(
        data.url
      );

      // ======================================
      // บันทึก Draft ทันที
      // ======================================
      saveDraftNow(
        data.url
      );

      console.log(
        'Cover uploaded successfully'
      );
    } catch (error) {
      console.error(
        'Cover Upload Error:',
        error
      );

      setCoverImageUrl('');

      setCoverError(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถอัปโหลดหน้าปกได้'
      );
    } finally {
      setIsUploadingCover(false);

      // อนุญาตให้เลือกไฟล์เดิมซ้ำได้
      e.target.value = '';

      // ล้าง Object URL
      URL.revokeObjectURL(
        previewUrl
      );
    }
  };

  // ==========================================
  // OPEN FILE PICKER
  // ==========================================
  const handleSelectCover = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      isUploadingCover
    ) {
      return;
    }

    fileInputRef.current?.click();
  };

  // ==========================================
  // SUBMIT
  // ==========================================
  const handleSubmit = (
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !formData.corePremise.trim()
    ) {
      return;
    }

    if (
      isUploadingCover
    ) {
      return;
    }

    const cleanFormData = {
      title:
        formData.title.trim(),

      corePremise:
        formData.corePremise.trim(),

      genre:
        formData.genre,

      tone:
        formData.tone,

      length:
        formData.length,

      protagonist:
        formData.protagonist.trim(),

      worldSetting:
        formData.worldSetting.trim(),

      coverImageUrl:
        coverImageUrl,
    };

    console.log(
      'Create Story Data:',
      cleanFormData
    );

    sessionStorage.setItem(
      'cozytales_create_story',
      JSON.stringify(
        cleanFormData
      )
    );

    sessionStorage.removeItem(
      DRAFT_KEY
    );

    onClose();

    router.push(
      '/story/generating'
    );
  };

  // ==========================================
  // CLOSED
  // ==========================================
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >

        {/* =====================================
            HEADER
        ====================================== */}
        <div className="modal-header">
          <div className="step-indicator">
            <span>
              📌 ขั้นตอนที่ {step} จาก 3
            </span>

            <span className="step-tag">
              {step === 1 &&
                'พล็อตเรื่อง (Premise)'}

              {step === 2 &&
                'สไตล์และหมวดหมู่ (Style)'}

              {step === 3 &&
                'รายละเอียดเพิ่มเติม (Details)'}
            </span>
          </div>

          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>

        {/* =====================================
            BODY
        ====================================== */}
        <div className="modal-body">

          {/* =====================================
              STEP 1
          ====================================== */}
          {step === 1 && (
            <div className="step-content">

              <h2>
                เรื่องราวของคุณเกี่ยวกับอะไร?
              </h2>

              <div className="form-group">
                <label>
                  ชื่อเรื่อง (ไม่จำเป็นต้องระบุ)
                </label>

                <input
                  type="text"
                  placeholder="เช่น ผู้เขียนแผนที่แห่งรัตติกาล..."
                  value={
                    formData.title
                  }
                  onChange={(e) =>
                    updateFormData({
                      title:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  พล็อตหลัก / เรื่องย่อ
                  {' '}
                  (Core Premise) *
                </label>

                <textarea
                  rows={5}
                  placeholder="นักวาดแผนที่หนุ่มค้นพบว่าแผนที่ที่เขาวาดสามารถเปลี่ยนแปลงความจริงได้..."
                  value={
                    formData.corePremise
                  }
                  onChange={(e) =>
                    updateFormData({
                      corePremise:
                        e.target.value,
                    })
                  }
                />

                <small className="form-tip">
                  AI จะใช้พล็อตนี้เป็นจุดเริ่มต้น
                  ในการสร้างเนื้อเรื่องทั้งหมดของคุณ
                </small>
              </div>

            </div>
          )}

          {/* =====================================
              STEP 2
          ====================================== */}
          {step === 2 && (
            <div className="step-content">

              <h2>
                กำหนดโทนและหมวดหมู่ของเรื่อง
              </h2>

              <div className="form-section">

                <label className="section-label">
                  หมวดหมู่ (Genre)
                </label>

                <div className="pill-grid">
                  {GENRES.map(
                    (genre) => (
                      <button
                        key={genre}
                        type="button"
                        className={`pill-btn ${
                          formData.genre ===
                          genre
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          updateFormData({
                            genre,
                          })
                        }
                      >
                        {genre}
                      </button>
                    )
                  )}
                </div>

              </div>

              <div className="form-section">

                <label className="section-label">
                  โทนเรื่อง
                  (Narrative Tone)
                </label>

                <div className="pill-grid">
                  {TONES.map(
                    (tone) => (
                      <button
                        key={tone}
                        type="button"
                        className={`pill-btn ${
                          formData.tone ===
                          tone
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          updateFormData({
                            tone,
                          })
                        }
                      >
                        {tone}
                      </button>
                    )
                  )}
                </div>

              </div>

              <div className="form-section">

                <label className="section-label">
                  ความยาวของเรื่อง
                  (Story Length)
                </label>

                <div className="length-grid">
                  {LENGTHS.map(
                    (item) => (
                      <button
                        key={
                          item.label
                        }
                        type="button"
                        className={`length-card ${
                          formData.length ===
                          item.label
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() =>
                          updateFormData({
                            length:
                              item.label,
                          })
                        }
                      >
                        <span className="length-title">
                          {
                            item.label
                          }
                        </span>

                        <span className="length-desc">
                          {
                            item.desc
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>

              </div>

            </div>
          )}

          {/* =====================================
              STEP 3
          ====================================== */}
          {step === 3 && (
            <div className="step-content">

              <h2>
                ระบุตัวละครและฉากหลัง
              </h2>

              <div className="form-group">
                <label>
                  ชื่อตัวละครเอก
                  {' '}
                  (ไม่จำเป็นต้องระบุ)
                </label>

                <input
                  type="text"
                  placeholder="เช่น อลัน"
                  value={
                    formData.protagonist
                  }
                  onChange={(e) =>
                    updateFormData({
                      protagonist:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  โลก / ฉากหลัง
                  {' '}
                  (ไม่จำเป็นต้องระบุ)
                </label>

                <input
                  type="text"
                  placeholder="เช่น เมืองลอนดอนยุควิกตอเรียนที่ซ่อนเร้นเวทมนตร์..."
                  value={
                    formData.worldSetting
                  }
                  onChange={(e) =>
                    updateFormData({
                      worldSetting:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* ==================================
                  COVER
              =================================== */}
              <div className="form-section">

                <label className="section-label">
                  หน้าปกนิยาย
                  {' '}
                  (ไม่จำเป็นต้องระบุ)
                </label>

                <div className="cover-upload-box">

                  {coverPreview ? (
                    <div
                      className="cover-preview-wrapper"
                      style={{
                        width:
                          '220px',
                        height:
                          '140px',
                        maxWidth:
                          '100%',
                        margin:
                          '0 auto 12px',
                        overflow:
                          'hidden',
                        borderRadius:
                          '12px',
                      }}
                    >
                      <img
                        src={
                          coverPreview
                        }
                        alt="ตัวอย่างหน้าปกนิยาย"
                        className="cover-preview"
                        style={{
                          width:
                            '100%',
                          height:
                            '100%',
                          objectFit:
                            'cover',
                          display:
                            'block',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="cover-placeholder">

                      <span className="cover-icon">
                        🖼️
                      </span>

                      <span>
                        ยังไม่ได้เลือกหน้าปก
                      </span>

                    </div>
                  )}

                  {/* ==================================
                      HIDDEN FILE INPUT
                  =================================== */}
                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      handleCoverChange
                    }
                    style={{
                      display:
                        'none',
                    }}
                  />

                  {/* ==================================
                      SELECT BUTTON
                  =================================== */}
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={
                      handleSelectCover
                    }
                    disabled={
                      isUploadingCover
                    }
                  >
                    {isUploadingCover
                      ? 'กำลังอัปโหลด...'
                      : coverPreview
                        ? 'เปลี่ยนหน้าปก'
                        : 'เลือกหน้าปก'}
                  </button>

                  {isUploadingCover && (
                    <small className="form-tip">
                      กำลังอัปโหลดหน้าปกไปยังระบบ...
                    </small>
                  )}

                  {coverImageUrl &&
                    !isUploadingCover && (
                      <small className="form-tip">
                        ✓ อัปโหลดหน้าปกสำเร็จ
                      </small>
                    )}

                  {coverError && (
                    <small
                      className="form-tip"
                      style={{
                        color:
                          '#b42318',
                      }}
                    >
                      {
                        coverError
                      }
                    </small>
                  )}

                  <small className="form-tip">
                    รองรับ JPG, PNG, WEBP
                    ขนาดไม่เกิน 5 MB
                  </small>

                </div>
              </div>

              {/* ==================================
                  BLUEPRINT
              =================================== */}
              <div className="blueprint-box">

                <span className="blueprint-title">
                  📐 โครงร่างนิยาย
                  (STORY BLUEPRINT)
                </span>

                <p className="blueprint-story-title">
                  <strong>
                    ชื่อเรื่อง:
                  </strong>{' '}
                  {formData.title ||
                    '(รอให้ AI ตั้งชื่อให้อัตโนมัติ)'}
                </p>

                <div className="blueprint-tags">

                  <span className="tag">
                    {
                      formData.genre
                    }
                  </span>

                  <span className="tag">
                    {
                      formData.tone
                    }
                  </span>

                  <span className="tag">
                    {
                      formData.length
                    }
                  </span>

                </div>

                {formData.corePremise && (
                  <p className="blueprint-premise">
                    "
                    {
                      formData.corePremise
                    }
                    "
                  </p>
                )}

              </div>

            </div>
          )}

        </div>

        {/* =====================================
            FOOTER
        ====================================== */}
        <div className="modal-footer">

          {step > 1 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBack}
            >
              ‹ ย้อนกลับ
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              ยกเลิก
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              className="btn-primary"
              onClick={handleNext}
              disabled={
                step === 1 &&
                !formData.corePremise.trim()
              }
            >
              ถัดไป ›
            </button>
          ) : (
            <button
              type="button"
              className="btn-generate"
              onClick={handleSubmit}
              disabled={
                !formData.corePremise.trim() ||
                isUploadingCover
              }
            >
              ✨ เริ่มสร้างนิยาย
            </button>
          )}

        </div>

      </div>
    </div>
  );
};