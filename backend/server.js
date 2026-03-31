const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/marksDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));


// 🔹 SCHEMA
const studentSchema = new mongoose.Schema({
  name: String,
  rollNo: String,
  semesters: [
    {
      semester: Number,
      subjects: [
        {
          subjectName: String,
          internalMarks: [
            {
              examType: String,
              marks: Number
            }
          ]
        }
      ]
    }
  ]
});

const Student = mongoose.model("Student", studentSchema);


// 🔥 ADD / UPDATE API
app.post("/add", async (req, res) => {
  try {
    let { name, rollNo, semester, subjects } = req.body;

    rollNo = String(rollNo);

    let student = await Student.findOne({ rollNo });

    if (!student) {
      await Student.create({
        name,
        rollNo,
        semesters: [{ semester, subjects }]
      });
      return res.send("✅ New student created");
    }

    let sem = student.semesters.find(s => s.semester == semester);

    if (!sem) {
      student.semesters.push({ semester, subjects });
      await student.save();
      return res.send("➕ New semester added");
    }

    subjects.forEach(newSub => {

      let existingSub = sem.subjects.find(
        s => s.subjectName === newSub.subjectName
      );

      if (!existingSub) {
        sem.subjects.push(newSub);
      } else {

        newSub.internalMarks.forEach(newInt => {

          if (newInt.examType === "internal2") {
            const hasInternal1 = existingSub.internalMarks.find(
              i => i.examType === "internal1"
            );
            if (!hasInternal1) return;
          }

          let oldInt = existingSub.internalMarks.find(
            i => i.examType === newInt.examType
          );

          if (oldInt) {
            oldInt.marks = newInt.marks;
          } else {
            existingSub.internalMarks.push(newInt);
          }

        });

      }

    });

    await student.save();
    res.send("🔄 Semester updated");

  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
  }
});


// 🔍 GET SINGLE STUDENT
app.get("/student/:roll", async (req, res) => {
  try {
    const rollNo = String(req.params.roll);
    const student = await Student.findOne({ rollNo });

    if (!student) return res.status(404).send("Not found");

    res.json(student);

  } catch (err) {
    res.status(500).send("Error");
  }
});


// 🔥 PERFORMANCE API (UPDATED 🔥)
app.get("/students/performance", async (req, res) => {
  try {
    const students = await Student.find();

    const result = students.map(stu => {

      let total1 = 0, total2 = 0, totalOverall = 0;
      let count = 0;

      stu.semesters.forEach(sem => {
        sem.subjects.forEach(sub => {

          let i1 = 0, i2 = 0;

          sub.internalMarks.forEach(i => {
            if (i.examType === "internal1") i1 = i.marks;
            if (i.examType === "internal2") i2 = i.marks;
          });

          total1 += i1;
          total2 += i2;
          totalOverall += (i1 + i2);
          count++;

        });
      });

      return {
        name: stu.name,
        rollNo: stu.rollNo,
        avgInternal1: count ? (total1 / count).toFixed(2) : 0,
        avgInternal2: count ? (total2 / count).toFixed(2) : 0,
        avgOverall: count ? (totalOverall / count).toFixed(2) : 0
      };
    });

    res.json(result);

  } catch (err) {
    res.status(500).send("Error");
  }
});


app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});