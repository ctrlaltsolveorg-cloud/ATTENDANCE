-- =====================================================================
-- BIHAR ENGINEERING UNIVERSITY - PURNEA COLLEGE OF ENGINEERING (PCE)
-- MECHATRONICS ENGINEERING (M.T.E) 3RD SEMESTER ATTENDANCE SYSTEM
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- =====================================================================

-- 1. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    roll_no TEXT NOT NULL,
    reg_no TEXT,
    roll_int INTEGER NOT NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    dob TEXT,
    branch TEXT DEFAULT 'Mechatronics',
    semester TEXT DEFAULT '3rd',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    type TEXT NOT NULL,
    faculty TEXT,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT,
    present_student_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_students INTEGER DEFAULT 30,
    is_holiday BOOLEAN DEFAULT false,
    holiday_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT false;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS holiday_reason TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Anonymous / Public Access
CREATE POLICY "Allow public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Allow public insert subjects" ON public.subjects FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read attendance_records" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance_records" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance_records" ON public.attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance_records" ON public.attendance_records FOR DELETE USING (true);

-- =====================================================================
-- SEED DATA: 11 Mechatronics Subjects
-- =====================================================================
INSERT INTO public.subjects (id, code, name, short_name, type, faculty, icon) VALUES
('161301', '161301', 'Eng. Mechanics', 'EM', 'Theory', 'Prof. Md. Saquib Akhter / Amanatullah', 'settings-outline'),
('161302', '161302', 'Fluid Mechanics & Machinery', 'FM&M', 'Theory', 'Prof. Ramchandra Sahani', 'water-outline'),
('161303', '161303', 'Eng. Mathematics III', 'M-III', 'Theory', 'Dr. Shwetambara', 'calculator-outline'),
('161304', '161304', 'Basic Mechatronics', 'BM', 'Theory', 'Prof. Dheeraj / Abhimanyu / Ratnesh', 'hardware-chip-outline'),
('161305', '161305', 'Strength of Material', 'SOM', 'Theory', 'Prof. Payal Priya', 'build-outline'),
('161306', '161306', 'Universal Human Value', 'UHV', 'Theory', 'Dr. Dewasis Pal', 'heart-outline'),
('161307', '161307', 'Indian Knowledge System', 'IKS', 'Theory', 'Prof. Ravi Anand / Uday Kr. Singh', 'book-outline'),
('161301P', '161301P', 'EM LAB', 'EM LAB', 'Lab', 'Prof. Md. Saquib Akhter / Amanatullah', 'construct-outline'),
('161302P', '161302P', 'FM&M LAB', 'FM&M LAB', 'Lab', 'Prof. RC Sahani / Bipin Kr. Sharma', 'flask-outline'),
('161305P', '161305P', 'SOM LAB', 'SOM LAB', 'Lab', 'Prof. Payal Priya / Asif Ansari', 'hammer-outline'),
('161308P', '161308P', 'Internship', 'Internship', 'Practical', 'Prof. Raushan Kumar', 'briefcase-outline')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- SEED DATA: 19 BEU Official + 11 Placeholder Students
-- =====================================================================
INSERT INTO public.students (id, roll_no, reg_no, roll_int, name, father_name, mother_name, dob) VALUES
('mte_stu_1', '250701', '25161131001', 1, 'NITISH KUMAR', 'MAHANAND KUMAR DAS', 'RANJANA DEVI', '5/4/2008'),
('mte_stu_2', '250718', '25161131002', 2, 'ABHINAV ANAND', 'SATYAPAL SINGH', 'ABHILASHA SINGH', '12/2/2005'),
('mte_stu_3', '250703', '25161131003', 3, 'MD SHAHDULLAH', 'MD MANZOOR ALAM', 'SAJENOOR KHATOON', '25/04/2006'),
('mte_stu_4', '250708', '25161131004', 4, 'ADITYA KUMAR', 'BINOD KUMAR', 'SUNITA KUMARI', '20/1/2006'),
('mte_stu_5', '250713', '25161131005', 5, 'BABUL KUMAR', 'SHAMBHU THAKUR', 'MUNNI DEVI', ''),
('mte_stu_6', '250724', '25161131006', 6, 'ADITYA KUMAR', 'UPENDRA KUMAR', 'SANJU DEVI', '24/6/2008'),
('mte_stu_7', '250714', '25161131007', 7, 'RAHUL KUMAR', 'SHYAM KISHOR PRASAD', 'SUNDARI DEVI', '23/3/2007'),
('mte_stu_8', '250706', '25161131008', 8, 'MANISH KUMAR', 'AJAY KUMAR GUPTA', 'SANGEETA GUPTA', '14/8/2006'),
('mte_stu_9', '250707', '25161131009', 9, 'SAURABH SUMAN', 'ANIL KUMAR', 'RENU YADAV', '12/9/2005'),
('mte_stu_10', '250704', '25161131010', 10, 'SHIVAM KUMAR', 'ARUN SINGH', 'VIBHA DEVI', '10/05/2008'),
('mte_stu_11', '250721', '25161131011', 11, 'PRIYANSHU KUMAR', 'PANKAJ KUMAR JHA', 'JYOTI DEVI', '21/1/2007'),
('mte_stu_12', '250709', '25161131012', 12, 'MOAAZ AHMAD', 'EHTASHAM KHALID', 'SABEEHA QAMAR', '20/2/2006'),
('mte_stu_13', '250716', '25161131013', 13, 'FARHAN YUNUS', 'MD YUNUS', 'REHANA KHATOON', '12/12/2005'),
('mte_stu_14', '250725', '25161131014', 14, 'ANKIT KUMAR', 'KRISHNA SINGH', 'RANI DEVI', '16/10/2004'),
('mte_stu_15', '250723', '25161131015', 15, 'UDYANT KUMAR', 'DEEPAK KUMAR JAISWAL', 'SHOBHA JAISWAL', '23/3/2008'),
('mte_stu_16', '250720', '25161131016', 16, 'MITHLESH KUMAR SHARMA', 'ANIL SHARMA', 'MINA DEVI', '5/2/2008'),
('mte_stu_17', '250715', '25161131017', 17, 'DEVRAJ KUMAR', 'SANJEEV KUMAR RAY', 'LALA KUMARI', '16/1/2008'),
('mte_stu_18', '250722', '25161131018', 18, 'PIYUSH KUMAR', 'MANOJ KUMAR', 'SRIJANTI DEVI', '21/6/2005'),
('mte_stu_19', 'YB240712', '24161131012', 19, 'VISHWJEET PRATAP SINGH', 'BHANU PRATAP SINGH', 'SEEMA SINGH', '07/07/2003'),
('mte_stu_20', '250726', '25161131020', 20, 'S1', '', '', ''),
('mte_stu_21', '250727', '25161131021', 21, 'S2', '', '', ''),
('mte_stu_22', '250728', '25161131022', 22, 'S3', '', '', ''),
('mte_stu_23', '250729', '25161131023', 23, 'S4', '', '', ''),
('mte_stu_24', '250730', '25161131024', 24, 'S5', '', '', ''),
('mte_stu_25', '250731', '25161131025', 25, 'S6', '', '', ''),
('mte_stu_26', '250732', '25161131026', 26, 'S7', '', '', ''),
('mte_stu_27', '250733', '25161131027', 27, 'S8', '', '', ''),
('mte_stu_28', '250734', '25161131028', 28, 'S9', '', '', ''),
('mte_stu_29', '250735', '25161131029', 29, 'S10', '', '', ''),
('mte_stu_30', '250736', '25161131030', 30, 'S11', '', '', '')
ON CONFLICT (id) DO NOTHING;
