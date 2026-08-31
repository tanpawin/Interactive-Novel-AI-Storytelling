'use client';

import React, { useState } from 'react';
import { CreateStoryFormData, Genre, NarrativeTone, StoryLength } from '../types/story';
import '../styles/modal.css';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ปรับเป็น optional (?) เผื่อไม่ได้ส่งมา
  onSubmit?: (formData: CreateStoryFormData, initialContent: string) => void;
}

const GENRES: Genre[] = [
  'แฟนตาซี', 'โรแมนติก', 'สืบสวนสอบสวน', 
  'ไซไฟ', 'ประวัติศาสตร์', 'สยองขวัญ', 
  'ผจญภัย', 'วรรณกรรม'
];

const TONES: NarrativeTone[] = [
  'มืดมนและสมจริง', 'สดใสและจินตนาการ', 'โรแมนติก', 
  'ปรัชญา', 'ตลกขบขัน', 'ระทึกขวัญ'
];

const LENGTHS: { label: StoryLength; desc: string }[] = [
  { label: 'เรื่องสั้น', desc: '~5 บท' },
  { label: 'นวนิยายขนาดกลาง', desc: '~15 บท' },
  { label: 'นวนิยายยาว', desc: '~30+ บท' },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState<CreateStoryFormData>({
    title: '',
    corePremise: '',
    genre: 'แฟนตาซี',
    tone: 'มืดมนและสมจริง',
    length: 'นวนิยายขนาดกลาง',
    protagonist: '',
    worldSetting: '',
  });

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) setStep((prev) => (prev + 1) as 2 | 3);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2);
  };

  const handleSubmit = async () => {
    if (!formData.corePremise.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: 'create_story',
          formData: formData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // เช็คก่อนว่ามีฟังก์ชัน onSubmit ส่งมาจาก Parent หรือไม่
        if (typeof onSubmit === 'function') {
          onSubmit(formData, data.content);
        } else {
          console.log('Story generated successfully:', data.content);
        }

        // Reset State
        setStep(1);
        setFormData({
          title: '',
          corePremise: '',
          genre: 'แฟนตาซี',
          tone: 'มืดมนและสมจริง',
          length: 'นวนิยายขนาดกลาง',
          protagonist: '',
          worldSetting: '',
        });
        onClose();
      } else {
        alert('เกิดข้อผิดพลาดจาก AI: ' + (data.error || 'ไม่สามารถสร้างเนื้อหาได้'));
      }
    } catch (err) {
      console.error('Error generating story:', err);
      alert('ไม่สามารถเชื่อมต่อกับระบบ AI ได้');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="step-indicator">
            <span>📌 ขั้นตอนที่ {step} จาก 3</span>
            <span className="step-tag">
              {step === 1 && 'พล็อตเรื่อง (Premise)'}
              {step === 2 && 'สไตล์และหมวดหมู่ (Style)'}
              {step === 3 && 'รายละเอียดเพิ่มเติม (Details)'}
            </span>
          </div>
          <button className="btn-close" onClick={onClose} disabled={isGenerating}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* STEP 1: PREMISE */}
          {step === 1 && (
            <div className="step-content">
              <h2>เรื่องราวของคุณเกี่ยวกับอะไร?</h2>
              
              <div className="form-group">
                <label>ชื่อเรื่อง (ไม่จำเป็นต้องระบุ)</label>
                <input
                  type="text"
                  placeholder="เช่น ผู้เขียนแผนที่แห่งรัตติกาล..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>พล็อตหลัก / เรื่องย่อ (Core Premise) *</label>
                <textarea
                  rows={4}
                  placeholder="นักวาดแผนที่หนุ่มค้นพบว่าแผนที่ที่เขาวาดสามารถเปลี่ยนแปลงความจริงได้ ทำให้เขาถูกดึงเข้าไปติดในเหตุการณ์ปริศนา..."
                  value={formData.corePremise}
                  onChange={(e) => setFormData({ ...formData, corePremise: e.target.value })}
                />
                <small className="form-tip">AI จะใช้พล็อตนี้เป็นจุดเริ่มต้นในการสร้างเนื้อเรื่องทั้งหมดของคุณ</small>
              </div>
            </div>
          )}

          {/* STEP 2: STYLE */}
          {step === 2 && (
            <div className="step-content">
              <h2>กำหนดโทนและหมวดหมู่ของเรื่อง</h2>

              <div className="form-section">
                <label className="section-label">หมวดหมู่ (Genre)</label>
                <div className="pill-grid">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`pill-btn ${formData.genre === g ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, genre: g })}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="section-label">โทนเรื่อง (Narrative Tone)</label>
                <div className="pill-grid">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`pill-btn ${formData.tone === t ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, tone: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <label className="section-label">ความยาวของเรื่อง (Story Length)</label>
                <div className="length-grid">
                  {LENGTHS.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className={`length-card ${formData.length === item.label ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, length: item.label })}
                    >
                      <span className="length-title">{item.label}</span>
                      <span className="length-desc">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS */}
          {step === 3 && (
            <div className="step-content">
              <h2>ระบุตัวละครและฉากหลัง</h2>

              <div className="form-group">
                <label>ชื่อตัวละครเอก (Protagonist - ไม่จำเป็นต้องระบุ)</label>
                <input
                  type="text"
                  placeholder="เช่น อลัน, นักวาดแผนที่ผู้มีพรสวรรค์ชวนสงสัย"
                  value={formData.protagonist}
                  onChange={(e) => setFormData({ ...formData, protagonist: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>โลก / ฉากหลัง (World & Setting - ไม่จำเป็นต้องระบุ)</label>
                <input
                  type="text"
                  placeholder="เช่น เมืองลอนดอนยุควิกตอเรียนที่ซ่อนเร้นเวทมนตร์..."
                  value={formData.worldSetting}
                  onChange={(e) => setFormData({ ...formData, worldSetting: e.target.value })}
                />
              </div>

              {/* Story Blueprint Summary Box */}
              <div className="blueprint-box">
                <span className="blueprint-title">📐 โครงร่างนิยาย (STORY BLUEPRINT)</span>
                <p className="blueprint-story-title">
                  <strong>ชื่อเรื่อง:</strong> {formData.title || '(รอให้ AI ตั้งชื่อให้อัตโนมัติ)'}
                </p>
                <div className="blueprint-tags">
                  <span className="tag">{formData.genre}</span>
                  <span className="tag">{formData.tone}</span>
                  <span className="tag">{formData.length}</span>
                </div>
                {formData.corePremise && (
                  <p className="blueprint-premise">"{formData.corePremise}"</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          {step > 1 ? (
            <button className="btn-secondary" onClick={handleBack} disabled={isGenerating}>
              ‹ ย้อนกลับ
            </button>
          ) : (
            <button className="btn-secondary" onClick={onClose} disabled={isGenerating}>
              ยกเลิก
            </button>
          )}

          {step < 3 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={step === 1 && !formData.corePremise.trim()}
            >
              ถัดไป ›
            </button>
          ) : (
            <button
              className="btn-generate"
              onClick={handleSubmit}
              disabled={isGenerating || !formData.corePremise.trim()}
            >
              {isGenerating ? (
                <>
                  <span className="spinner">✨</span> กำลังให้ AI แต่งเรื่อง...
                </>
              ) : (
                '✨ เริ่มสร้างนิยาย (Generate Story)'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};