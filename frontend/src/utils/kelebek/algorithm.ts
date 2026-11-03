// Kelebek Algorithm — Gelişmiş Katmanlı Orantısal Dağıtım & Minimum İhlal Optimizasyonu

function fisherYatesShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Koltuk etiketi: A1, B1, C1, D1 ...
// colIndex: bank sütun indeksi (0, 1, 2...)
// seatInBank: 0 (sol koltuk), 1 (sağ koltuk)
// rowIndex: sıra no (0, 1, 2...)
export function getSeatLabel(colIndex, rowIndex, seatInBank) {
  const seatIndex = colIndex * 2 + seatInBank;
  const letter = String.fromCharCode(65 + seatIndex);
  const number = rowIndex + 1;
  return `${letter}${number}`;
}

// Ayrık çiftler arama haritası oluşturur (studentId -> Set of partnerStudentIds)
function buildSeparateMap(separatePairs = []) {
  const map = new Map();
  for (const p of separatePairs) {
    if (!p.student1Id || !p.student2Id) continue;
    const id1 = String(p.student1Id);
    const id2 = String(p.student2Id);
    if (!map.has(id1)) map.set(id1, new Set());
    if (!map.has(id2)) map.set(id2, new Set());
    map.get(id1).add(id2);
    map.get(id2).add(id1);
  }
  return map;
}

// İki öğrencinin ayrık çift olup olmadığını kontrol eder
function areStudentsSeparatePartners(s1, s2, separateMap) {
  if (!s1 || !s2 || !separateMap || separateMap.size === 0) return false;
  const id1 = String(s1.id || s1.no);
  const id2 = String(s2.id || s2.no);
  const partners = separateMap.get(id1);
  return !!(partners && partners.has(id2));
}

// 1. Aşama: Sınıf Düzeylerini Salonlara Dengeli & Orantılı Dağıtma (Ayrık Öğrencileri Farklı Salonlara Yönlendirir)
function layeredDistribution(activeStudents, rooms, separatePairs = []) {
  const separateMap = buildSeparateMap(separatePairs);
  const gradeGroups = {};
  for (const s of activeStudents) {
    if (!gradeGroups[s.grade]) gradeGroups[s.grade] = [];
    gradeGroups[s.grade].push(s);
  }

  // Her grup içindeki öğrencileri şubelerine göre de karıştır
  for (const g in gradeGroups) {
    gradeGroups[g] = fisherYatesShuffle(gradeGroups[g]);
  }

  const totalStudents = activeStudents.length;
  const totalCapacity = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);
  const roomCapacities = rooms.map(r => r.rows * r.cols * 2);
  const grades = Object.keys(gradeGroups).sort();

  // Her salonun alacağı hedef öğrenci sayısı
  let roomTargets = roomCapacities.map(cap => Math.floor(totalStudents * cap / totalCapacity));
  let assigned = roomTargets.reduce((a, b) => a + b, 0);
  const sortedByCap = roomCapacities
    .map((cap, i) => ({ cap, i }))
    .sort((a, b) => b.cap - a.cap);

  let extra = totalStudents - assigned;
  for (let k = 0; k < extra; k++) {
    roomTargets[sortedByCap[k % sortedByCap.length].i]++;
  }

  // Sınıf oranlarına göre her salona öğrenci paylaştır
  const gradePointers = {};
  for (const g of grades) gradePointers[g] = 0;

  const roomStudents = rooms.map(() => []);

  for (let ri = 0; ri < rooms.length; ri++) {
    const target = roomTargets[ri];
    for (const g of grades) {
      const quota = Math.floor(target * (gradeGroups[g].length / totalStudents));
      for (let k = 0; k < quota; k++) {
        if (gradePointers[g] < gradeGroups[g].length) {
          roomStudents[ri].push(gradeGroups[g][gradePointers[g]++]);
        }
      }
    }
  }

  // Yuvarlama farkı kalan öğrencileri en çok boş yeri olan salonlara dağıt
  const remaining = [];
  for (const g of grades) {
    while (gradePointers[g] < gradeGroups[g].length) {
      remaining.push(gradeGroups[g][gradePointers[g]++]);
    }
  }

  const shuffledRemain = fisherYatesShuffle(remaining);
  for (const s of shuffledRemain) {
    let bestRoom = -1, maxRemainCap = -1;
    for (let ri = 0; ri < rooms.length; ri++) {
      const rem = roomCapacities[ri] - roomStudents[ri].length;
      if (rem > 0 && rem > maxRemainCap) {
        maxRemainCap = rem;
        bestRoom = ri;
      }
    }
    if (bestRoom >= 0) {
      roomStudents[bestRoom].push(s);
    }
  }

  // 🛡️ AYRIK ÖĞRENCİ ÇİFTLERİ OPTİMİZASYONU:
  // Birden fazla salon varsa (rooms.length >= 2), aynı salona düşen ayrık öğrencileri
  // aynı sınıf düzeyindeki (grade) başka salondaki uygun öğrencilerle takas ederek farklı salonlara ayır
  if (rooms.length >= 2 && separateMap.size > 0) {
    for (let ri = 0; ri < rooms.length; ri++) {
      for (let si = 0; si < roomStudents[ri].length; si++) {
        const studentA = roomStudents[ri][si];
        const studentAId = String(studentA.id || studentA.no);
        const partnerIds = separateMap.get(studentAId);
        if (!partnerIds || partnerIds.size === 0) continue;

        // Bu salonda studentA'nın ayrık eşi var mı?
        const partnerIndexInSameRoom = roomStudents[ri].findIndex((other, oIdx) =>
          oIdx !== si && partnerIds.has(String(other.id || other.no))
        );

        if (partnerIndexInSameRoom !== -1) {
          const partnerStudent = roomStudents[ri][partnerIndexInSameRoom];
          const partnerGrade = partnerStudent.grade;

          // partnerStudent'ı başka bir salondaki aynı sınıf düzeyinden (grade) uygun bir öğrenciyle takas et
          for (let targetRi = 0; targetRi < rooms.length; targetRi++) {
            if (targetRi === ri) continue;

            // Hedef salonda studentA veya partnerStudent'ın ayrık eşi var mı?
            const targetHasConflict = roomStudents[targetRi].some(other => {
              const oId = String(other.id || other.no);
              return partnerIds.has(oId) || (separateMap.get(String(partnerStudent.id || partnerStudent.no))?.has(oId));
            });

            if (targetHasConflict) continue;

            // Hedef salonda partnerStudent ile aynı sınıfta olan ve kendi ayrık kısıtı olmayan bir aday bul
            const candidateIdx = roomStudents[targetRi].findIndex(cand => {
              if (cand.grade !== partnerGrade) return false;
              const candPartners = separateMap.get(String(cand.id || cand.no));
              // Adayın mevcut salonda ayrık eşi olmamalı
              if (candPartners) {
                const wouldConflictInRi = roomStudents[ri].some(other =>
                  candPartners.has(String(other.id || other.no))
                );
                if (wouldConflictInRi) return false;
              }
              return true;
            });

            if (candidateIdx !== -1) {
              // Takas yap: partnerStudent targetRi'ye, candidate ise ri'ye geçer
              const candidate = roomStudents[targetRi][candidateIdx];
              roomStudents[targetRi][candidateIdx] = partnerStudent;
              roomStudents[ri][partnerIndexInSameRoom] = candidate;
              break;
            }
          }
        }
      }
    }
  }

  return roomStudents;
}

// Koltuğa aday öğrenci yerleştirildiğinde oluşacak ceza puanını hesaplar
// Düşük ceza = Daha iyi kelebek yerleşimi
function calculatePlacementPenalty(grid, r, c, bankSeat, candidate, separateMap = null) {
  const currentSeatCol = c * 2 + bankSeat;
  const partnerSeatCol = c * 2 + (1 - bankSeat);
  let penalty = 0;

  // 1. Yanındaki bank komşusu kontrolü (EN ÖNEMLİ)
  const partner = grid[r][partnerSeatCol];
  if (partner) {
    if (partner.grade === candidate.grade) penalty += 200; // Aynı sınıf düzeyi
    if (partner.sinif === candidate.sinif) penalty += 500; // Aynı şube

    // 🛡️ Ayrık öğrenci yan yana gelirse en ağır ceza!
    if (separateMap && areStudentsSeparatePartners(candidate, partner, separateMap)) {
      penalty += 30000;
    }
  }

  // 2. Ön-Arka komşuları kontrolü (Aynı sütundaki üst ve alt sıralar)
  // Üst komşu: r - 1
  if (r > 0 && grid[r - 1][currentSeatCol]) {
    const above = grid[r - 1][currentSeatCol];
    if (above.sinif === candidate.sinif) penalty += 150; // Ön-arka aynı şube
    if (above.grade === candidate.grade) penalty += 40;  // Ön-arka aynı sınıf düzeyi

    if (separateMap && areStudentsSeparatePartners(candidate, above, separateMap)) {
      penalty += 20000;
    }
  }

  // 3. Çapraz komşu kontrolü (Üst sıradaki bank komşusu)
  if (r > 0 && grid[r - 1][partnerSeatCol]) {
    const aboveDiag = grid[r - 1][partnerSeatCol];
    if (aboveDiag.sinif === candidate.sinif) penalty += 60;
    if (aboveDiag.grade === candidate.grade) penalty += 20;

    if (separateMap && areStudentsSeparatePartners(candidate, aboveDiag, separateMap)) {
      penalty += 12000;
    }
  }

  // 4. 🛡️ Salonda daha önce oturmuş ayrık eş kontrolü (Koltuk Mesafesini Maksimize Et)
  if (separateMap && separateMap.size > 0) {
    const candId = String(candidate.id || candidate.no);
    const partnerIds = separateMap.get(candId);
    if (partnerIds && partnerIds.size > 0) {
      for (let prevR = 0; prevR < grid.length; prevR++) {
        for (let prevC = 0; prevC < grid[prevR].length; prevC++) {
          const seated = grid[prevR][prevC];
          if (seated && partnerIds.has(String(seated.id || seated.no))) {
            const rowDiff = Math.abs(r - prevR);
            const colDiff = Math.abs(Math.floor(currentSeatCol / 2) - Math.floor(prevC / 2));
            const manhattanDist = rowDiff + colDiff;
            // Mesafe ne kadar küçükse ceza o kadar büyük
            penalty += Math.max(0, 12 - manhattanDist) * 1500;
          }
        }
      }
    }
  }

  return penalty;
}

// 2. Aşama: Akıllı Kelebek Yerleşimi (Koltuk Bazlı Akıllı Seçim)
function bucketSeating(students, room, separatePairs = []) {
  const separateMap = buildSeparateMap(separatePairs);
  const { rows, cols } = room;
  const grid = Array.from({ length: rows }, () => Array(cols * 2).fill(null));

  // Kalan öğrencileri havuzda tut
  let pool = fisherYatesShuffle([...students]);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pool.length === 0) break;

      // Sol koltuk (seat 0)
      let bestSolIdx = -1;
      let minSolPenalty = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const pen = calculatePlacementPenalty(grid, r, c, 0, pool[i], separateMap);
        if (pen < minSolPenalty) {
          minSolPenalty = pen;
          bestSolIdx = i;
          if (pen === 0) break; // Kusursuz aday bulunduysa döngüden erken çık
        }
      }

      if (bestSolIdx !== -1) {
        const student = pool.splice(bestSolIdx, 1)[0];
        grid[r][c * 2] = {
          ...student,
          koltuk: getSeatLabel(c, r, 0),
        };
      }

      if (pool.length === 0) break;

      // Sağ koltuk (seat 1)
      let bestSagIdx = -1;
      let minSagPenalty = Infinity;

      for (let i = 0; i < pool.length; i++) {
        const pen = calculatePlacementPenalty(grid, r, c, 1, pool[i], separateMap);
        if (pen < minSagPenalty) {
          minSagPenalty = pen;
          bestSagIdx = i;
          if (pen === 0) break;
        }
      }

      if (bestSagIdx !== -1) {
        const student = pool.splice(bestSagIdx, 1)[0];
        grid[r][c * 2 + 1] = {
          ...student,
          koltuk: getSeatLabel(c, r, 1),
        };
      }
    }
  }

  // İhlalleri tespit et
  const violations = findViolations(grid, rows, cols, separatePairs);

  // Yerel Takas İyileştirmesi (Post-processing Local Optimization)
  if (violations.length > 0) {
    optimizeSeating(grid, rows, cols, separatePairs);
  }

  const finalViolations = findViolations(grid, rows, cols, separatePairs);
  return { grid, violations: finalViolations };
}

// İhlalleri bul
export function findViolations(grid, rows, cols, separatePairs = []) {
  const violations = [];
  const separateMap = buildSeparateMap(separatePairs);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = grid[r][c * 2];
      const right = grid[r][c * 2 + 1];

      // Yan yana aynı sınıf düzeyi veya şube
      if (left && right) {
        if (left.grade === right.grade || left.sinif === right.sinif) {
          violations.push({
            row: r,
            col: c,
            type: left.sinif === right.sinif ? 'same-branch' : 'same-grade',
            reason: left.sinif === right.sinif ? 'Aynı Şube' : 'Aynı Sınıf',
          });
        }

        // 🛡️ Ayrık öğrenci yan yana oturmuşsa kritik ihlal
        if (separateMap && areStudentsSeparatePartners(left, right, separateMap)) {
          violations.push({
            row: r,
            col: c,
            type: 'separate-partner',
            reason: 'Ayrık Öğrenci Yan Yana',
          });
        }
      }
    }
  }

  return violations;
}

// İhlalleri çözmek için akıllı takas optimizasyonu (Simulated Annealing / Local Search)
function optimizeSeating(grid, rows, cols, separatePairs = []) {
  let maxAttempts = 120;

  while (maxAttempts-- > 0) {
    const currentViolations = findViolations(grid, rows, cols, separatePairs);
    if (currentViolations.length === 0) break;

    const v = currentViolations[0];
    const targetRow = v.row;
    const targetCol = v.col * 2 + (Math.random() > 0.5 ? 1 : 0);
    const targetStudent = grid[targetRow][targetCol];

    if (!targetStudent) continue;

    // Başka bir koltuk bul ve takas etmeyi dene
    let swapped = false;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols * 2; c++) {
        if (r === targetRow && Math.floor(c / 2) === v.col) continue;

        const candidateStudent = grid[r][c];
        if (!candidateStudent) continue;

        // Geçici takas
        grid[targetRow][targetCol] = candidateStudent;
        grid[r][c] = targetStudent;

        const newViolations = findViolations(grid, rows, cols, separatePairs);
        if (newViolations.length < currentViolations.length) {
          // İhlal azaldı, koltuk etiketlerini güncelle ve takası onayla
          candidateStudent.koltuk = getSeatLabel(Math.floor(targetCol / 2), targetRow, targetCol % 2);
          targetStudent.koltuk = getSeatLabel(Math.floor(c / 2), r, c % 2);
          swapped = true;
          break;
        } else {
          // Geri al
          grid[targetRow][targetCol] = targetStudent;
          grid[r][c] = candidateStudent;
        }
      }
      if (swapped) break;
    }

    if (!swapped) break;
  }
}

// Ana Kelebek Algoritması
export function runAlgorithm(students, rooms, activeGrades, separatePairs = []) {
  const activeStudents = students.filter(s => !s.isExempt && activeGrades.includes(s.grade));

  if (activeStudents.length === 0) {
    throw new Error('Sınava girecek seçili sınıf düzeylerinde öğrenci bulunamadı.');
  }

  if (!rooms || rooms.length === 0) {
    throw new Error('Sınav için en az 1 salon eklenmelidir.');
  }

  const totalCapacity = rooms.reduce((sum, r) => sum + r.rows * r.cols * 2, 0);
  if (activeStudents.length > totalCapacity) {
    throw new Error(`Kapasite yetersiz! Sınava girecek öğrenci: ${activeStudents.length}, Toplam salon kapasitesi: ${totalCapacity}`);
  }

  const roomStudentsList = layeredDistribution(activeStudents, rooms, separatePairs);

  const assignments = [];
  let totalViolations = 0;

  for (let ri = 0; ri < rooms.length; ri++) {
    const room = rooms[ri];
    const roomStudents = roomStudentsList[ri];
    const { grid, violations } = bucketSeating(roomStudents, room, separatePairs);
    assignments.push({ room, grid, violations });
    totalViolations += violations.length;
  }

  // 🛡️ Ayrık Öğrenci Çiftlerinin Nihai Yerleşim Durumunu Hesapla
  const studentSeatMap = new Map();
  assignments.forEach((assignment, roomIdx) => {
    const roomName = assignment.room.name;
    const roomId = assignment.room.id;
    assignment.grid.forEach((row, rIdx) => {
      row.forEach((seat, cIdx) => {
        if (seat) {
          const sId = String(seat.id || seat.no);
          studentSeatMap.set(sId, {
            student: seat,
            roomId,
            roomName,
            roomIndex: roomIdx,
            row: rIdx,
            col: cIdx,
            koltuk: seat.koltuk || getSeatLabel(Math.floor(cIdx / 2), rIdx, cIdx % 2)
          });
        }
      });
    });
  });

  const separationResults = (separatePairs || []).map(pair => {
    const id1 = String(pair.student1Id);
    const id2 = String(pair.student2Id);
    const pos1 = studentSeatMap.get(id1);
    const pos2 = studentSeatMap.get(id2);

    if (!pos1 || !pos2) {
      return {
        ...pair,
        status: 'not_both_active',
        message: 'Öğrencilerden biri veya ikisi seçili sınıf düzeyinde veya sınavda aktif değil.'
      };
    }

    if (pos1.roomId !== pos2.roomId) {
      return {
        ...pair,
        status: 'different_rooms',
        isDifferentRooms: true,
        pos1,
        pos2,
        message: `${pos1.student.adSoyad} (${pos1.roomName} - ${pos1.koltuk}) ve ${pos2.student.adSoyad} (${pos2.roomName} - ${pos2.koltuk}) farklı salonlara yerleştirildi.`
      };
    }

    // Aynı salondalar: Mesafe hesabı
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(Math.floor(pos1.col / 2) - Math.floor(pos2.col / 2));
    const distance = rowDiff + colDiff;
    const isAdjacent = (pos1.row === pos2.row && Math.floor(pos1.col / 2) === Math.floor(pos2.col / 2));

    return {
      ...pair,
      status: isAdjacent ? 'same_bench' : 'same_room_apart',
      isDifferentRooms: false,
      isAdjacent,
      distance,
      pos1,
      pos2,
      message: `${pos1.roomName} salonunda aralarında ${distance} sıra mesafe ile konumlandırıldı (${pos1.koltuk} ↔ ${pos2.koltuk}).`
    };
  });

  return {
    assignments,
    violations: totalViolations,
    timestamp: new Date().toISOString(),
    activeGrades,
    separationResults
  };
}
