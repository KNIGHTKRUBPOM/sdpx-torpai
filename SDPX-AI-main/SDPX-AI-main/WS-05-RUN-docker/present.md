# Present: Docker & Environment Loop

## เวลา: 1 ชั่วโมง (6 กลุ่ม × 10 นาที)
## รูปแบบ: อาจารย์ random 1 คนจากกลุ่ม

## 🎯 การ present นี้ฝึกอะไร

| สิ่งที่จะทำได้ | ใช้ในงานจริงอย่างไร |
|---|---|
| อธิบาย Dockerfile ทีละบรรทัดให้คนอื่นเข้าใจ | เป็นสิ่งที่ถูกถามใน code review และในสัมภาษณ์งานสาย DevOps |
| demo ว่า test แดงแล้ว exit code เปลี่ยนจริง | ฝึกนิสัยพิสูจน์ด้วยหลักฐาน แทนการบอกว่ามันน่าจะทำงาน |
| เปรียบเทียบ before/after ด้วยตัวเลขขั้นตอนและเวลา | การสื่อสารผลงานด้วยตัวเลขทำให้คนนอกทีมเห็นคุณค่าของงานที่ทำ |
| ตอบคำถาม "ถ้าจะเพิ่ม service อีกตัวจะทำอย่างไร" | ระบบจริงมี service เพิ่มตลอด — ต้องขยายได้โดยไม่รื้อ |

---

## สิ่งที่ต้อง Present (10 นาที/กลุ่ม)

### Demo (5 นาที)
1. รัน `docker compose up` และเปิด app ใน browser
2. แสดง Dockerfile และอธิบาย layer caching strategy + multi-stage
3. แสดง test database config และอธิบายว่าทำไมต้อง ephemeral
4. **Demo exit code**: ทำให้ test แดง 1 ตัว → รัน test ใน container → แสดง exit code ≠ 0
5. เปิด `docs/setup-steps.md` แสดง before/after

### คำถาม (5 นาที)
อาจารย์อาจถาม:
- "Instruction นี้ใน Dockerfile ทำอะไร ทำไมต้องมี"
- "ถ้าแก้ source code 1 บรรทัด Docker จะ rebuild กี่ layer"
- "ทำไม test database ถึงไม่มี volume ถาวร"
- "ถ้าจะเพิ่ม Redis เข้า stack จะ add ใน compose อย่างไร"
- "ถ้าไม่มี `--exit-code-from` จะเกิดอะไรขึ้นกับ CI ในสัปดาห์หน้า"
- "AI สร้าง Dockerfile มาให้ มีอะไรที่ต้องแก้บ้าง"

---

## Rubric (5 คะแนน)

| เกณฑ์ | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| **Dockerfile Quality** | build ไม่ได้ | build ได้แต่ไม่ best practice | layer caching ถูกต้อง | + non-root + pin tag | + multi-stage + healthcheck + อธิบายได้ทุกบรรทัด |
| **Environment Loop** | ยังต้อง setup หลายขั้น | compose up ได้แต่ต้องแก้อะไรก่อน | คำสั่งเดียวรันได้ | + เพื่อนที่ไม่เคยรันก็รันได้ | + วัด before/after ได้ + hot reload ใช้งานจริง |
| **Test Environment** | ไม่มี | share db กับ dev | แยก db | ephemeral db | ephemeral + `--exit-code-from` + พิสูจน์แล้วว่า exit code ถูก |
| **Security & Config** | มี secret ในไฟล์ | ไม่มี secret แต่ hardcode config | ใช้ env var | + `.dockerignore` ครบ | + non-root + ไม่มี dev deps ใน runtime image |
| **Understanding** | อธิบาย instruction ไม่ได้ | อธิบายได้บางส่วน | อธิบายได้ทั้งหมด | + รู้ trade-offs | + แก้ปัญหา on the spot ได้ |

**คะแนนเต็ม: 5 คะแนน** (เฉลี่ยจาก 5 เกณฑ์)
