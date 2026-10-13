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

// 1. Aşama: Sınıf Düzeylerini Salonlara Dengeli & Orantılı Dağıtma
function layeredDistribution(activeStudents, rooms) {
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

  return roomStudents;
}

// Koltuğa aday öğrenci yerleştirildiğinde oluşacak ceza puanını hesaplar
// Düşük ceza = Daha iyi kelebek yerleşimi
function calculatePlacementPenalty(grid, r, c, bankSeat, candidate) {
  const currentSeatCol = c * 2 + bankSeat;
  const partnerSeatCol = c * 2 + (1 - bankSeat);
  let penalty = 0;

  // 1. Yanındaki bank komşusu kontrolü (EN ÖNEMLİ)
  const partner = grid[r][partnerSeatCol];
  if (partner) {
    if (partner.grade === candidate.grade) penalty += 200; // Aynı sınıf düzeyi
    if (partner.sinif === candidate.sinif) penalty += 500; // Aynı şube
  }

  // 2. Ön-Arka komşuları kontrolü (Aynı sütundaki üst ve alt sıralar)
  // Üst komşu: r - 1
  if (r > 0 && grid[r - 1][currentSeatCol]) {
    const above = grid[r - 1][currentSeatCol];
    if (above.sinif === candidate.sinif) penalty += 150; // Ön-arka aynı şube
    if (above.grade === candidate.grade) penalty += 40;  // Ön-arka aynı sınıf düzeyi
  }

  // 3. Çapraz komşu kontrolü (Üst sıradaki bank komşusu)
  if (r > 0 && grid[r - 1][partnerSeatCol]) {
    const aboveDiag = grid[r - 1][partnerSeatCol];
    if (aboveDiag.sinif === candidate.sinif) penalty += 60;
    if (aboveDiag.grade === candidate.grade) penalty += 20;
  }

  return penalty;
}

// 2. Aşama: Akıllı Kelebek Yerleşimi (Koltuk Bazlı Akıllı Seçim)
function bucketSeating(students, room) {
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
        const pen = calculatePlacementPenalty(grid, r, c, 0, pool[i]);
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
        const pen = calculatePlacementPenalty(grid, r, c, 1, pool[i]);
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
  const violations = findViolations(grid, rows, cols);

  // Yerel Takas İyileştirmesi (Post-processing Local Optimization)
  if (violations.length > 0) {
    optimizeSeating(grid, rows, cols);
  }

  const finalViolations = findViolations(grid, rows, cols);
  return { grid, violations: finalViolations };
}

// İhlalleri bul
export function findViolations(grid, rows, cols) {
  const violations = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const left = grid[r][c * 2];
      const right = grid[r][c * 2 + 1];

      // Yan yana aynı sınıf düzeyi veya şube
      if (left && right && (left.grade === right.grade || left.sinif === right.sinif)) {
        violations.push({
          row: r,
          col: c,
          type: left.sinif === right.sinif ? 'same-branch' : 'same-grade',
          reason: left.sinif === right.sinif ? 'Aynı Şube' : 'Aynı Sınıf',
        });
      }
    }
  }

  return violations;
}

// İhlalleri çözmek için akıllı takas optimizasyonu (Simulated Annealing / Local Search)
function optimizeSeating(grid, rows, cols) {
  let maxAttempts = 120;

  while (maxAttempts-- > 0) {
    const currentViolations = findViolations(grid, rows, cols);
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

        const newViolations = findViolations(grid, rows, cols);
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
export function runAlgorithm(students, rooms, activeGrades) {
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

  const roomStudentsList = layeredDistribution(activeStudents, rooms);

  const assignments = [];
  let totalViolations = 0;

  for (let ri = 0; ri < rooms.length; ri++) {
    const room = rooms[ri];
    const roomStudents = roomStudentsList[ri];
    const { grid, violations } = bucketSeating(roomStudents, room);
    assignments.push({ room, grid, violations });
    totalViolations += violations.length;
  }

  return {
    assignments,
    violations: totalViolations,
    timestamp: new Date().toISOString(),
    activeGrades,
  };
}
