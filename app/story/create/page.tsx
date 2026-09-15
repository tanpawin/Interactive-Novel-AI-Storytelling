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
} from '@/types/story';

const DRAFT_KEY = 'cozytales_create_story_draft';
const CREATE_KEY = 'cozytales_create_story';

const genres: Genre[] = [
  'แฟนตาซี',
  'โรแมนติก',
  'สืบสวนสอบสวน',
  'ไซไฟ',
  'ประวัติศาสตร์',
  'สยองขวัญ',
  'ผจญภัย',
  'วรรณกรรม',
];

const tones: NarrativeTone[] = [
  'มืดมนและสมจริง',
  'สดใสและจินตนาการ',
  'โรแมนติก',
  'ปรัชญา',
  'ตลกขบขัน',
  'ระทึกขวัญ',
];

const lengths: StoryLength[] = [
  'เรื่องสั้น',
  'นวนิยายขนาดกลาง',
  'นวนิยายยาว',
];

const emptyForm: CreateStoryFormData = {
  title: '',
  corePremise: '',
  genre: 'แฟนตาซี',
  tone: 'สดใสและจินตนาการ',
  length: 'เรื่องสั้น',
  protagonist: '',
  worldSetting: '',
};

export default function CreateStoryPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [formData, setFormData] =
    useState<CreateStoryFormData>(emptyForm);

  const [coverImageUrl, setCoverImageUrl] =
    useState('');

  const [isUploading, setIsUploading] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
   * ป้องกัน Auto Save ทำงานก่อน
   * Restore Draft เสร็จ
   */
  const hasRestoredDraft = useRef(false);

  /* =====================================================
     Restore Draft
  ===================================================== */

  useEffect(() => {
    try {
      const savedDraft =
        sessionStorage.getItem(DRAFT_KEY);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        if (parsed.formData) {
          setFormData({
            ...emptyForm,
            ...parsed.formData,
          });
        }

        if (parsed.coverImageUrl) {
          setCoverImageUrl(
            parsed.coverImageUrl
          );
        }

        if (parsed.step) {
          setStep(parsed.step);
        }
      }
    } catch (error) {
      console.error(
        'Restore draft error:',
        error
      );
    } finally {
      /*
       * ให้ Auto Save เริ่มทำงาน
       * หลังจาก Restore เสร็จแล้วเท่านั้น
       */
      hasRestoredDraft.current = true;
    }
  }, []);

  /* =====================================================
     Auto Save Draft
  ===================================================== */

  useEffect(() => {
    /*
     * ป้องกันการบันทึก emptyForm
     * ทับ Draft ก่อน Restore
     */
    if (!hasRestoredDraft.current) {
      return;
    }

    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          formData,
          coverImageUrl,
          step,
        })
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
  ]);

  /* =====================================================
     Update Form
  ===================================================== */

  const updateField = <
    K extends keyof CreateStoryFormData
  >(
    field: K,
    value: CreateStoryFormData[K]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =====================================================
     Cover Upload
  ===================================================== */

  const handleCoverUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);

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

      if (!response.ok) {
        throw new Error(
          data.error ||
            'อัปโหลดรูปไม่สำเร็จ'
        );
      }

      setCoverImageUrl(
        data.url
      );
    } catch (error) {
      console.error(
        'Cover upload error:',
        error
      );
    } finally {
      setIsUploading(false);
    }
  };

  /* =====================================================
     Step Validation
  ===================================================== */

  const canNext = () => {
    if (step === 1) {
      return (
        formData.title.trim() !== '' &&
        formData.corePremise.trim() !== ''
      );
    }

    if (step === 2) {
      return (
        formData.protagonist.trim() !== ''
      );
    }

    return true;
  };

  /* =====================================================
     Navigation
  ===================================================== */

  const handleNext = () => {
    if (!canNext()) {
      return;
    }

    setStep((previous) =>
      Math.min(previous + 1, 3)
    );
  };

  const handleBack = () => {
    if (step === 1) {
      /*
       * ออกจากหน้าสร้างนิยาย
       * ให้ล้าง Draft เพื่อไม่ให้ข้อมูลเก่า
       * ติดกลับมาเมื่อเริ่มเรื่องใหม่
       */
      sessionStorage.removeItem(
        DRAFT_KEY
      );

      router.push('/');
      return;
    }

    setStep((previous) =>
      Math.max(previous - 1, 1)
    );
  };

  /* =====================================================
     Submit
  ===================================================== */

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    if (!formData.title.trim()) {
      return;
    }

    if (!formData.corePremise.trim()) {
      return;
    }

    setIsSubmitting(true);

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

    try {
      /*
       * Clear previous generation result
       * เพื่อป้องกัน Generating Page
       * หยิบ Story ID เก่ามาใช้
       */
      sessionStorage.removeItem(
        'cozytales_generated_story'
      );

      sessionStorage.removeItem(
        'cozytales_generating_story_id'
      );

      sessionStorage.setItem(
        CREATE_KEY,
        JSON.stringify(
          cleanFormData
        )
      );

      /*
       * เมื่อกดสร้างเรื่องแล้ว
       * Draft ไม่จำเป็นอีกต่อไป
       */
      sessionStorage.removeItem(
        DRAFT_KEY
      );

      router.push(
        '/story/generating'
      );
    } catch (error) {
      console.error(
        'Create story navigation error:',
        error
      );

      setIsSubmitting(false);
    }
  };

  return (
    <main className="story-create-page">
      <div className="story-create-container">

        {/* =================================================
            Header
        ================================================= */}

        <header className="story-create-header">

          <button
            type="button"
            className="story-create-back"
            onClick={handleBack}
          >
            ‹ กลับหน้าหลัก
          </button>

          <div className="story-create-heading">
            <span className="story-create-subtitle">
              CozyTales
            </span>

            <h1>
              สร้างนิยายเรื่องใหม่
            </h1>

            <p>
              เปลี่ยนจินตนาการของคุณให้กลายเป็นเรื่องราว
            </p>
          </div>

        </header>

        {/* =================================================
            Progress
        ================================================= */}

        <div className="story-create-progress">

          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className={`story-create-progress-item ${
                  step >= item
                    ? 'active'
                    : ''
                }`}
              >
                <div className="story-create-progress-number">
                  {item}
                </div>

                <span>
                  {item === 1 &&
                    'พื้นฐานเรื่อง'}

                  {item === 2 &&
                    'ตัวละคร'}

                  {item === 3 &&
                    'รูปแบบเรื่อง'}
                </span>
              </div>
            )
          )}

        </div>

        {/* =================================================
            Form Card
        ================================================= */}

        <section className="story-create-card">

          {/* ===============================================
              STEP 1
          =============================================== */}

          {step === 1 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">
                <span>
                  ขั้นตอนที่ 1
                </span>

                <h2>
                  มาเริ่มต้นเรื่องราวกัน
                </h2>

                <p>
                  กำหนดพื้นฐานของนิยายที่คุณอยากสร้าง
                </p>
              </div>

              <div className="story-create-fields">

                <div className="story-create-field">
                  <label>
                    ชื่อเรื่อง
                  </label>

                  <input
                    type="text"
                    value={
                      formData.title
                    }
                    onChange={(e) =>
                      updateField(
                        'title',
                        e.target.value
                      )
                    }
                    placeholder="เช่น คืนที่ดวงจันทร์หายไป"
                  />
                </div>

                <div className="story-create-field">
                  <label>
                    เรื่องย่อ / แก่นเรื่อง
                  </label>

                  <textarea
                    value={
                      formData.corePremise
                    }
                    onChange={(e) =>
                      updateField(
                        'corePremise',
                        e.target.value
                      )
                    }
                    placeholder="เล่าไอเดียหลักของเรื่องที่คุณอยากให้เกิดขึ้น..."
                    rows={6}
                  />
                </div>

                <div className="story-create-field">
                  <label>
                    แนวเรื่อง
                  </label>

                  <div className="story-create-options">
                    {genres.map(
                      (genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={
                            formData.genre ===
                            genre
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'genre',
                              genre
                            )
                          }
                        >
                          {genre}
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===============================================
              STEP 2
          =============================================== */}

          {step === 2 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">
                <span>
                  ขั้นตอนที่ 2
                </span>

                <h2>
                  ใครจะเป็นคนเดินทางในเรื่องนี้?
                </h2>

                <p>
                  กำหนดตัวละครเอกและโลกที่เรื่องราวจะเกิดขึ้น
                </p>
              </div>

              <div className="story-create-fields">

                <div className="story-create-field">
                  <label>
                    ตัวละครเอก
                  </label>

                  <input
                    type="text"
                    value={
                      formData.protagonist
                    }
                    onChange={(e) =>
                      updateField(
                        'protagonist',
                        e.target.value
                      )
                    }
                    placeholder="เช่น อาร์เธอร์ เพนเดิลตัน"
                  />
                </div>

                <div className="story-create-field">
                  <label>
                    โลก / สถานที่
                  </label>

                  <textarea
                    value={
                      formData.worldSetting
                    }
                    onChange={(e) =>
                      updateField(
                        'worldSetting',
                        e.target.value
                      )
                    }
                    placeholder="เช่น เมืองเล็ก ๆ ที่ซ่อนอยู่ท่ามกลางป่า..."
                    rows={5}
                  />
                </div>

                <div className="story-create-field">
                  <label>
                    โทนของเรื่อง
                  </label>

                  <div className="story-create-options">
                    {tones.map(
                      (tone) => (
                        <button
                          key={tone}
                          type="button"
                          className={
                            formData.tone ===
                            tone
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'tone',
                              tone
                            )
                          }
                        >
                          {tone}
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ===============================================
              STEP 3
          =============================================== */}

          {step === 3 && (
            <div className="story-create-step">

              <div className="story-create-step-heading">
                <span>
                  ขั้นตอนที่ 3
                </span>

                <h2>
                  รายละเอียดสุดท้าย
                </h2>

                <p>
                  เลือกความยาวและเพิ่มภาพปกให้เรื่องของคุณ
                </p>
              </div>

              <div className="story-create-fields">

                <div className="story-create-field">
                  <label>
                    ความยาวของนิยาย
                  </label>

                  <div className="story-create-length-options">
                    {lengths.map(
                      (length) => (
                        <button
                          key={length}
                          type="button"
                          className={
                            formData.length ===
                            length
                              ? 'selected'
                              : ''
                          }
                          onClick={() =>
                            updateField(
                              'length',
                              length
                            )
                          }
                        >
                          <strong>
                            {length}
                          </strong>

                          <span>
                            {length ===
                              'เรื่องสั้น' &&
                              '5 บท'}

                            {length ===
                              'นวนิยายขนาดกลาง' &&
                              '15 บท'}

                            {length ===
                              'นวนิยายยาว' &&
                              '30 บท'}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="story-create-field">
                  <label>
                    ภาพปก
                  </label>

                  <div className="story-create-cover">

                    {coverImageUrl ? (
                      <img
                        src={
                          coverImageUrl
                        }
                        alt="ภาพปกนิยาย"
                      />
                    ) : (
                      <div className="story-create-cover-empty">
                        ยังไม่มีภาพปก
                      </div>
                    )}

                  </div>

                  <label className="story-create-upload">
                    {isUploading
                      ? 'กำลังอัปโหลด...'
                      : 'เลือกภาพปก'}

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleCoverUpload
                      }
                    />
                  </label>
                </div>

                {/* Summary */}

                <div className="story-create-summary">

                  <div>
                    <span>
                      ชื่อเรื่อง
                    </span>

                    <strong>
                      {formData.title ||
                        '-'}
                    </strong>
                  </div>

                  <div>
                    <span>
                      แนว
                    </span>

                    <strong>
                      {formData.genre}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ความยาว
                    </span>

                    <strong>
                      {formData.length}
                    </strong>
                  </div>

                  <div>
                    <span>
                      ตัวละครเอก
                    </span>

                    <strong>
                      {formData.protagonist ||
                        '-'}
                    </strong>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* =================================================
              Footer
          ================================================= */}

          <div className="story-create-footer">

            <button
              type="button"
              className="story-create-secondary"
              onClick={handleBack}
            >
              {step === 1
                ? 'ยกเลิก'
                : 'ย้อนกลับ'}
            </button>

            {step < 3 ? (
              <button
                type="button"
                className="story-create-primary"
                onClick={handleNext}
                disabled={!canNext()}
              >
                ถัดไป →
              </button>
            ) : (
              <button
                type="button"
                className="story-create-primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'กำลังเตรียมเรื่อง...'
                  : '✨ สร้างนิยาย'}
              </button>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}