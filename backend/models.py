# backend/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Settings(BaseModel):
    schoolId: str = Field(default="default_school")
    schoolName: Optional[str] = None
    directorName: Optional[str] = None
    directorTitle: Optional[str] = None
    principalName: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
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

    # 📌 ÖNCELİKLİ TAM DOLDURULACAK GÜNLER & SON SAATLER TERCİHİ (Örn: Tamer'in Pazartesi ve Salı günleri)
    priorityFullDay: Optional[Any] = None
    priorityFullDays: Optional[List[str]] = Field(default_factory=list)
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
    maxTotalGapsLevel: Optional[str] = "medium"
    maxTotalGapsPenalty: Optional[int] = 60
    minTotalGapsLevel: Optional[str] = "off"
    minTotalGapsPenalty: Optional[int] = 0
    gapExemptTeacherIds: Optional[List[str]] = Field(default_factory=list)
    hourlyReserveLevel: Optional[str] = "off"
    hourlyReservePenalty: Optional[int] = 0
    minActiveDaysLevel: Optional[str] = "high"
    minActiveDaysPenalty: Optional[int] = 100
    minDaysExemptTeacherIds: Optional[List[str]] = Field(default_factory=list)

    class Config:
        extra = "allow"

class HardConstraints(BaseModel):
    enforceMaxTotalGaps: Optional[bool] = True
    maxTotalGaps: Optional[int] = 4
    maxTotalGapsLevel: Optional[str] = "medium"
    maxTotalGapsPenalty: Optional[int] = 60
    enforceMinTotalGaps: Optional[bool] = False
    minTotalGaps: Optional[int] = 0
    minTotalGapsLevel: Optional[str] = "off"
    minTotalGapsPenalty: Optional[int] = 0
    gapExemptTeacherIds: Optional[List[str]] = Field(default_factory=list)

    # 🛡️ SAATLİK YEDEK / NÖBETÇİ ÖĞRETMEN GÜVENCESİ (İLK VE SON SAAT HARİÇ TÜM ARA SAATLER: 2..P-1)
    enforceHourlyReserve: Optional[bool] = False
    minHourlyReserveTeachers: Optional[int] = 1
    hourlyReserveLevel: Optional[str] = "off"
    hourlyReservePenalty: Optional[int] = 0
    enforceCategoricalFairness: Optional[bool] = True

    enforceMaxGaps: Optional[bool] = True
    maxGapsPerDay: Optional[int] = 2
    
    # ⚖️ GÜNLÜK DERS DAĞILIM DENGESİ & HAFTALIK ASGARİ AKTİF DERS GÜNÜ (3 GÜN VE ALTI DERS VERMEME)
    enforceDailyBalance: bool = True
    minDailyHours: int = 3
    enforceMinActiveDays: Optional[bool] = True
    minActiveDays: Optional[int] = 4
    minActiveDaysLevel: Optional[str] = "high"
    minActiveDaysPenalty: Optional[int] = 100
    minDaysExemptTeacherIds: Optional[List[str]] = Field(default_factory=list)
    
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

