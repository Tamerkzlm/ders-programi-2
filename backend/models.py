# backend/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Settings(BaseModel):
    schoolId: str = Field(default="pilot_okul_1")
    schoolName: Optional[str] = "HZ. AYŞE KIZ ANADOLU İMAM HATİP LİSESİ"
    directorName: Optional[str] = "CEMİL MURAT KURU"
    directorTitle: Optional[str] = "Okul Müdür V."
    principalName: Optional[str] = "Okul Müdürü"
    city: Optional[str] = "HATAY"
    district: Optional[str] = "ANTAKYA"
    days: List[str] 
    periodsPerDay: int 
    lunchBreakAfter: Optional[int] = None
    lunchAfter: Optional[int] = 4
    lunchDuration: Optional[int] = 1

    class Config:
        extra = "allow"

class Course(BaseModel):
    id: Optional[str] = None
    subject: str
    code: Optional[str] = None
    hoursPerWeek: int
    teacherId: str

    class Config:
        extra = "allow"

class Classroom(BaseModel):
    id: str
    name: str
    grade: Optional[int] = 0  
    courses: List[Course]

    class Config:
        extra = "allow"

class Teacher(BaseModel):
    id: str
    name: str
    branch: str
    subjects: Optional[List[str]] = []  
    maxPerDay: int = 8  
    unavailable: Optional[Dict[str, List[int]]] = Field(default_factory=dict)
    
    # 🌟 İSTİSNA ÖĞRETMEN (1-2 gün gelip <17 saat dersi olanlar; sert kısıtlar uygulanmaz)
    isExempt: Optional[bool] = False

    # 📌 ÖNCELİKLİ TAM DOLDURULACAK GÜN & SON SAATLER TERCİHİ (Örn: Tamer'in Pazartesi günü)
    priorityFullDay: Optional[str] = None
    fillLateHours: Optional[bool] = False

    # 🏛️ İDARECİ (OKUL YÖNETİCİSİ) ETİKETİ - Dersleri en son boş kalan yerlere dağıtılır
    isAdministrator: Optional[bool] = False
    isPartTime: Optional[bool] = False

    # 🎯 VIP / ÖZEL GÜNLÜK SAAT SINIRLARI
    hasCustomConstraints: Optional[bool] = False
    customMaxHours: Optional[int] = 8
    customMinHours: Optional[int] = 2

    # 🌊 ESNEK / KAYAN TERCİHLER ("Boş günüm ya da saatim fark etmez" diyen öğretmenler)
    floatingConstraints: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        extra = "allow"

class SoftConstraints(BaseModel):
    minimizeGaps: bool = True
    gapPenalty: int = 40
    earlyStart: bool = True
    earlyStartPenalty: int = 20
    avoidStemLate: bool = True
    stemLatePenalty: int = 35

    class Config:
        extra = "allow"

class HardConstraints(BaseModel):
    enforceMaxGaps: bool = True
    maxGapsPerDay: int = 2
    
    # ⚖️ GÜNLÜK DERS DAĞILIM DENGESİ: Sadece aktif gündeki minimum ders saati seçeneği!
    enforceDailyBalance: bool = True
    minDailyHours: int = 3
    
    enforceConsecutiveClassRules: bool = True
    enforceIntensiveRules: bool = True
    maxHoursPerIntensiveCourse: int = 4
    solverTimeout: int = 60
    stopAtFirstSolution: Optional[bool] = False

    class Config:
        extra = "allow"

class PinnedSlot(BaseModel):
    classId: str
    day: str
    period: int
    subject: str
    teacherId: Optional[str] = None
    # Optional identifier for 2‑hour block pins (both cells share this id)
    groupId: Optional[str] = None

    class Config:
        extra = "allow"

class SolveRequest(BaseModel):
    settings: Settings
    teachers: List[Teacher]
    classrooms: List[Classroom]
    softConstraints: Optional[SoftConstraints] = None
    hardConstraints: Optional[HardConstraints] = None
    pinnedSlots: Optional[List[PinnedSlot]] = Field(default_factory=list)

    class Config:
        extra = "allow"

