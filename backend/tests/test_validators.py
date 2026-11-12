"""backend/tests/test_validators.py — Temel validator birim testleri"""
import pytest
from fastapi import HTTPException
from models import SolveRequest, Settings, Teacher, Classroom, Course
from validators import pre_flight_check

def make_base_request(**overrides):
    settings = Settings(days=["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"], periodsPerDay=8)
    teacher = Teacher(id="t1", name="Ahmet", branch="Matematik", maxPerDay=8)
    course = Course(subject="Matematik", hoursPerWeek=4, teacherId="t1")
    classroom = Classroom(id="c1", name="9A", courses=[course])
    data = dict(settings=settings, teachers=[teacher], classrooms=[classroom])
    data.update(overrides)
    return SolveRequest(**data)

def test_valid_request_passes():
    req = make_base_request()
    assert pre_flight_check(req) is True

def test_zero_hours_raises():
    course = Course(subject="Matematik", hoursPerWeek=0, teacherId="t1")
    classroom = Classroom(id="c1", name="9A", courses=[course])
    teacher = Teacher(id="t1", name="Ahmet", branch="Matematik", maxPerDay=8)
    settings = Settings(days=["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"], periodsPerDay=8)
    req = SolveRequest(settings=settings, teachers=[teacher], classrooms=[classroom])
    with pytest.raises(HTTPException) as exc:
        pre_flight_check(req)
    assert exc.value.status_code == 400
    assert "geçersiz" in exc.value.detail.lower()

def test_unassigned_teacher_raises():
    course = Course(subject="Fizik", hoursPerWeek=3, teacherId="MISSING_ID")
    classroom = Classroom(id="c1", name="9A", courses=[course])
    teacher = Teacher(id="t1", name="Ahmet", branch="Matematik", maxPerDay=8)
    settings = Settings(days=["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"], periodsPerDay=8)
    req = SolveRequest(settings=settings, teachers=[teacher], classrooms=[classroom])
    with pytest.raises(HTTPException) as exc:
        pre_flight_check(req)
    assert exc.value.status_code == 400

def test_capacity_overflow_raises():
    course = Course(subject="Matematik", hoursPerWeek=50, teacherId="t1")  # 5 gün × 8 saat = 40 max
    classroom = Classroom(id="c1", name="9A", courses=[course])
    teacher = Teacher(id="t1", name="Ahmet", branch="Matematik", maxPerDay=8)
    settings = Settings(days=["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma"], periodsPerDay=8)
    req = SolveRequest(settings=settings, teachers=[teacher], classrooms=[classroom])
    with pytest.raises(HTTPException) as exc:
        pre_flight_check(req)
    assert exc.value.status_code == 400

