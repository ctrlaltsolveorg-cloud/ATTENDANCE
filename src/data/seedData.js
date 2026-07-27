// Initial Seed Data for Purnea College of Engineering - Mechatronics Engineering (M.T.E) 3rd Semester

export const DEFAULT_BRANCH = {
  id: 'mte_3rd',
  name: 'Mechatronics Engineering (M.T.E)',
  semester: '3rd Semester (2025-2029)',
  college: 'Purnea College of Engineering, Purnea',
  room: 'Room No: 202',
};

export const DEFAULT_SUBJECTS = [
  { id: '161301', code: '161301', name: 'Eng. Mechanics', shortName: 'EM', type: 'Theory', faculty: 'Prof. Md. Saquib Akhter / Amanatullah', icon: 'settings-outline' },
  { id: '161302', code: '161302', name: 'Fluid Mechanics & Machinery', shortName: 'FM&M', type: 'Theory', faculty: 'Prof. Ramchandra Sahani', icon: 'water-outline' },
  { id: '161303', code: '161303', name: 'Eng. Mathematics III', shortName: 'M-III', type: 'Theory', faculty: 'Dr. Shwetambara', icon: 'calculator-outline' },
  { id: '161304', code: '161304', name: 'Basic Mechatronics', shortName: 'BM', type: 'Theory', faculty: 'Prof. Dheeraj / Abhimanyu / Ratnesh', icon: 'hardware-chip-outline' },
  { id: '161305', code: '161305', name: 'Strength of Material', shortName: 'SOM', type: 'Theory', faculty: 'Prof. Payal Priya', icon: 'build-outline' },
  { id: '161306', code: '161306', name: 'Universal Human Value', shortName: 'UHV', type: 'Theory', faculty: 'Dr. Dewasis Pal', icon: 'heart-outline' },
  { id: '161307', code: '161307', name: 'Indian Knowledge System', shortName: 'IKS', type: 'Theory', faculty: 'Prof. Ravi Anand / Uday Kr. Singh', icon: 'book-outline' },
  { id: '161301P', code: '161301P', name: 'EM LAB', shortName: 'EM LAB', type: 'Lab', faculty: 'Prof. Md. Saquib Akhter / Amanatullah', icon: 'construct-outline' },
  { id: '161302P', code: '161302P', name: 'FM&M LAB', shortName: 'FM&M LAB', type: 'Lab', faculty: 'Prof. RC Sahani / Bipin Kr. Sharma', icon: 'flask-outline' },
  { id: '161305P', code: '161305P', name: 'SOM LAB', shortName: 'SOM LAB', type: 'Lab', faculty: 'Prof. Payal Priya / Asif Ansari', icon: 'hammer-outline' },
  { id: '161308P', code: '161308P', name: 'Internship', shortName: 'Internship', type: 'Practical', faculty: 'Prof. Raushan Kumar', icon: 'briefcase-outline' },
];

// Official 19 Registered Mechatronics Engineering (M.T.E) Students (BEU Registration Details 2025)
// Serial Number is Roll Number (01 - 19)
export const DEFAULT_STUDENTS = [
  { id: 'mte_stu_1', rollNo: '01', univRoll: '250701', regNo: '25161131001', rollInt: 1, name: 'NITISH KUMAR', fatherName: 'MAHANAND KUMAR DAS', motherName: 'RANJANA DEVI', dob: '5/4/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_2', rollNo: '02', univRoll: '250718', regNo: '25161131002', rollInt: 2, name: 'ABHINAV ANAND', fatherName: 'SATYAPAL SINGH', motherName: 'ABHILASHA SINGH', dob: '12/2/2005', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_3', rollNo: '03', univRoll: '250703', regNo: '25161131003', rollInt: 3, name: 'MD SHAHDULLAH', fatherName: 'MD MANZOOR ALAM', motherName: 'SAJENOOR KHATOON', dob: '25/04/2006', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_4', rollNo: '04', univRoll: '250708', regNo: '25161131004', rollInt: 4, name: 'ADITYA KUMAR', fatherName: 'BINOD KUMAR', motherName: 'SUNITA KUMARI', dob: '20/1/2006', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_5', rollNo: '05', univRoll: '250713', regNo: '25161131005', rollInt: 5, name: 'BABUL KUMAR', fatherName: 'SHAMBHU THAKUR', motherName: 'MUNNI DEVI', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_6', rollNo: '06', univRoll: '250724', regNo: '25161131006', rollInt: 6, name: 'ADITYA KUMAR', fatherName: 'UPENDRA KUMAR', motherName: 'SANJU DEVI', dob: '24/6/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_7', rollNo: '07', univRoll: '250714', regNo: '25161131007', rollInt: 7, name: 'RAHUL KUMAR', fatherName: 'SHYAM KISHOR PRASAD', motherName: 'SUNDARI DEVI', dob: '23/3/2007', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_8', rollNo: '08', univRoll: '250706', regNo: '25161131008', rollInt: 8, name: 'MANISH KUMAR', fatherName: 'AJAY KUMAR GUPTA', motherName: 'SANGEETA GUPTA', dob: '14/8/2006', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_9', rollNo: '09', univRoll: '250707', regNo: '25161131009', rollInt: 9, name: 'SAURABH SUMAN', fatherName: 'ANIL KUMAR', motherName: 'RENU YADAV', dob: '12/9/2005', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_10', rollNo: '10', univRoll: '250704', regNo: '25161131010', rollInt: 10, name: 'SHIVAM KUMAR', fatherName: 'ARUN SINGH', motherName: 'VIBHA DEVI', dob: '10/05/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_11', rollNo: '11', univRoll: '250721', regNo: '25161131011', rollInt: 11, name: 'PRIYANSHU KUMAR', fatherName: 'PANKAJ KUMAR JHA', motherName: 'JYOTI DEVI', dob: '21/1/2007', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_12', rollNo: '12', univRoll: '250709', regNo: '25161131012', rollInt: 12, name: 'MOAAZ AHMAD', fatherName: 'EHTASHAM KHALID', motherName: 'SABEEHA QAMAR', dob: '20/2/2006', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_13', rollNo: '13', univRoll: '250716', regNo: '25161131013', rollInt: 13, name: 'FARHAN YUNUS', fatherName: 'MD YUNUS', motherName: 'REHANA KHATOON', dob: '12/12/2005', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_14', rollNo: '14', univRoll: '250725', regNo: '25161131014', rollInt: 14, name: 'ANKIT KUMAR', fatherName: 'KRISHNA SINGH', motherName: 'RANI DEVI', dob: '16/10/2004', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_15', rollNo: '15', univRoll: '250723', regNo: '25161131015', rollInt: 15, name: 'UDYANT KUMAR', fatherName: 'DEEPAK KUMAR JAISWAL', motherName: 'SHOBHA JAISWAL', dob: '23/3/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_16', rollNo: '16', univRoll: '250720', regNo: '25161131016', rollInt: 16, name: 'MITHLESH KUMAR SHARMA', fatherName: 'ANIL SHARMA', motherName: 'MINA DEVI', dob: '5/2/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_17', rollNo: '17', univRoll: '250715', regNo: '25161131017', rollInt: 17, name: 'DEVRAJ KUMAR', fatherName: 'SANJEEV KUMAR RAY', motherName: 'LALA KUMARI', dob: '16/1/2008', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_18', rollNo: '18', univRoll: '250722', regNo: '25161131018', rollInt: 18, name: 'PIYUSH KUMAR', fatherName: 'MANOJ KUMAR', motherName: 'SRIJANTI DEVI', dob: '21/6/2005', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_19', rollNo: '19', univRoll: 'YB240712', regNo: '24161131012', rollInt: 19, name: 'VISHWJEET PRATAP SINGH', fatherName: 'BHANU PRATAP SINGH', motherName: 'SEEMA SINGH', dob: '07/07/2003', branch: 'Mechatronics', semester: '3rd' },
  // Sample Placeholder Seats (Total Capacity: 30 Seats)
  { id: 'mte_stu_20', rollNo: '20', univRoll: '250726', regNo: '25161131020', rollInt: 20, name: 'S1', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_21', rollNo: '21', univRoll: '250727', regNo: '25161131021', rollInt: 21, name: 'S2', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_22', rollNo: '22', univRoll: '250728', regNo: '25161131022', rollInt: 22, name: 'S3', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_23', rollNo: '23', univRoll: '250729', regNo: '25161131023', rollInt: 23, name: 'S4', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_24', rollNo: '24', univRoll: '250730', regNo: '25161131024', rollInt: 24, name: 'S5', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_25', rollNo: '25', univRoll: '250731', regNo: '25161131025', rollInt: 25, name: 'S6', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_26', rollNo: '26', univRoll: '250732', regNo: '25161131026', rollInt: 26, name: 'S7', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_27', rollNo: '27', univRoll: '250733', regNo: '25161131027', rollInt: 27, name: 'S8', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_28', rollNo: '28', univRoll: '250734', regNo: '25161131028', rollInt: 28, name: 'S9', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_29', rollNo: '29', univRoll: '250735', regNo: '25161131029', rollInt: 29, name: 'S10', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
  { id: 'mte_stu_30', rollNo: '30', univRoll: '250736', regNo: '25161131030', rollInt: 30, name: 'S11', fatherName: '', motherName: '', dob: '', branch: 'Mechatronics', semester: '3rd' },
];
