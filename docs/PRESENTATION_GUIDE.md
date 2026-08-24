# PairEval WS-03 Presentation Guide

ฉบับอธิบายละเอียดและชุด Q&A อยู่ที่ [`PROJECT_NOTES_WS01_WS03.md`](PROJECT_NOTES_WS01_WS03.md)

## Demo 5 นาที

1. รัน backend suite: `23 passed`, source coverage `90%`, เวลา `1.62s`
2. เปิด `FakePairAssignmentRepository` แล้วชี้ว่า implement interface เดียวกับ adapter จริง
3. เปิด `make_classroom_students` และ `make_criterion` เพื่ออธิบาย factories/fixtures
4. Break it live: เอา status filter ใน `ScoringService.quality_index` ออก → test submitted-only แดง → คืนโค้ด
5. รัน Playwright flow: landing → 6-choice evaluation → progress `3/3` → interim result

## Test ที่ควรอธิบาย

`test_prd_worked_example_is_protected_by_golden_scores` ปกป้องสูตร PRD §9.5 ตั้งแต่ band mapping, criterion weights ถึง participation multiplier หากเปลี่ยน floor, น้ำหนัก หรือ multiplier โดยไม่ตั้งใจ คะแนน `16.93/10.97` จะไม่ตรงทันที

## จุดตัดสินใจด้านการออกแบบ

- ไม่ normalize คะแนนให้ผลรวมเป็นหนึ่ง เพราะไม่ใช่คะแนนคุณภาพ
- ไม่สร้าง pair ตอน runtime; publish แล้ว persist เพื่อ audit/reproduce ได้
- ใช้ max-flow allocation เพื่อให้ coverage และ evaluator workload สมดุล
- ใช้ `Decimal` เพราะ score snapshots ต้อง reproducible
- student result ไม่มี evaluator identity หรือ daily delta เพื่อป้องกันการอนุมานผู้ให้คะแนน

## คำตอบ Q&A สั้น ๆ

- **ทำไม Fake ไม่ใช้ DB จริง?** Unit test ต้องเร็วและแยก business rule; integration test ของ PostgreSQL เป็นอีกชั้นหนึ่ง
- **Fixture ต่างจาก Factory?** Factory สร้างข้อมูลหลายรูปแบบผ่าน overrides; fixture จัด lifecycle/dependency ที่ test reuse
- **coverage 90% พอไหม?** เป็นสัญญาณปริมาณ ไม่ใช่ fidelity; break-test พิสูจน์ว่ากฎ submitted-only ถูกปกป้องจริง
- **กฎไหนยังไม่มี test?** OIDC/authorization, atomic CSV, database immutability และ anonymity across exports ถูกระบุเป็น accepted gaps ใน `TEST_PLAN.md`
- **ทำไม coverage ลด 5 → 4?** ห้อง 12 คน/3 กลุ่มมี evaluator ที่ไม่อยู่ในสองกลุ่มของคู่นั้นเพียง 4 คน; มากกว่านี้ต้องซ้ำหรือผิด self-group rule
