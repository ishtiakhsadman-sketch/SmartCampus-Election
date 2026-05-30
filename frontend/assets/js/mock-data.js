/* =========================================================
   SmartCampus Election - Mock Data
   Sample frontend-only data for positions, candidates,
   notices, and election timeline
========================================================= */

const positions = [
  {
    id: 1,
    title: "Vice President (VP)",
    seats: 1,
    responsibility: "Supports executive leadership, policy implementation, and student representation.",
    candidateCount: 2
  },
  {
    id: 2,
    title: "General Secretary (GS)",
    seats: 1,
    responsibility: "Coordinates organizational activities, meetings, and strategic decisions.",
    candidateCount: 2
  },
  {
    id: 3,
    title: "Assistant General Secretary (AGS)",
    seats: 1,
    responsibility: "Assists the General Secretary in operations and event coordination.",
    candidateCount: 1
  },
  {
    id: 4,
    title: "Secretary of Liberation War & Democratic Movement",
    seats: 1,
    responsibility: "Promotes democratic values, historical awareness, and commemorative activities.",
    candidateCount: 1
  },
  {
    id: 5,
    title: "Science & Technology Secretary",
    seats: 1,
    responsibility: "Supports innovation, science programs, and technology initiatives.",
    candidateCount: 2
  },
  {
    id: 6,
    title: "International Secretary",
    seats: 1,
    responsibility: "Encourages international student engagement and global collaboration.",
    candidateCount: 1
  },
  {
    id: 7,
    title: "Literature & Cultural Secretary",
    seats: 1,
    responsibility: "Promotes literature, arts, performance, and cultural inclusion.",
    candidateCount: 1
  },
  {
    id: 8,
    title: "Research & Publication Secretary",
    seats: 1,
    responsibility: "Supports research engagement, publications, and academic development.",
    candidateCount: 1
  },
  {
    id: 9,
    title: "Student Transportation Secretary",
    seats: 1,
    responsibility: "Addresses student transport concerns and transit coordination.",
    candidateCount: 1
  },
  {
    id: 10,
    title: "Social Service Secretary",
    seats: 1,
    responsibility: "Leads volunteering, outreach, and community service initiatives.",
    candidateCount: 1
  },
  {
    id: 11,
    title: "Career Development Secretary",
    seats: 1,
    responsibility: "Focuses on internships, job readiness, and career support.",
    candidateCount: 1
  },
  {
    id: 12,
    title: "Health & Environment Secretary",
    seats: 1,
    responsibility: "Promotes wellness awareness, health support, and sustainability.",
    candidateCount: 1
  },
  {
    id: 13,
    title: "Human Rights & Law Secretary",
    seats: 1,
    responsibility: "Supports fairness, rights awareness, and legal guidance initiatives.",
    candidateCount: 1
  },
  {
    id: 14,
    title: "Communication, Media & Cafeteria Secretary",
    seats: 1,
    responsibility: "Handles communication, campus media visibility, and cafeteria concerns.",
    candidateCount: 1
  },
  {
    id: 15,
    title: "Sports Secretary",
    seats: 1,
    responsibility: "Promotes sports programs, tournaments, and student fitness engagement.",
    candidateCount: 1
  },
  {
    id: 16,
    title: "Executive Committee Member",
    seats: 6,
    responsibility: "Supports committee decision-making and broad student representation.",
    candidateCount: 3
  }
];

const candidates = [
  {
    id: 1,
    name: "Ayesha Rahman",
    department: "Computer Science",
    session: "2022-23",
    position: "Vice President (VP)",
    manifesto: "Build transparent student engagement and practical academic support programs.",
    bio: "Ayesha is an active campus organizer focused on student participation, digital services, and leadership accountability.",
    goals: [
      "Improve student representation channels",
      "Launch policy feedback sessions",
      "Strengthen campus service oversight"
    ],
    contact: "candidate1@smartcampus.edu",
    avatarUrl: "assets/avatars/avatar_female.png"
  },
  {
    id: 2,
    name: "Tanvir Hasan",
    department: "Business Administration",
    session: "2021-22",
    position: "Vice President (VP)",
    manifesto: "Advance student welfare through smart planning and open communication.",
    bio: "Tanvir has worked in student clubs and volunteer programs with a focus on coordination and institution-wide communication.",
    goals: [
      "Create regular executive open forums",
      "Support student welfare desks",
      "Improve communication between units"
    ],
    contact: "candidate2@smartcampus.edu",
    avatarUrl: "assets/avatars/avatar_male.png"
  },
  {
    id: 3,
    name: "Nusrat Jahan",
    department: "English",
    session: "2022-23",
    position: "General Secretary (GS)",
    manifesto: "Ensure efficient administration and better student access to election information.",
    bio: "Nusrat is known for organizing events and managing student communications with a careful and inclusive approach.",
    goals: [
      "Digitize common student communication",
      "Increase notice clarity",
      "Improve committee workflow"
    ],
    contact: "candidate3@smartcampus.edu"
  },
  {
    id: 4,
    name: "Sabbir Ahmed",
    department: "Law",
    session: "2021-22",
    position: "General Secretary (GS)",
    manifesto: "Lead with policy clarity, structure, and student-first administration.",
    bio: "Sabbir has experience in policy debates, student representation, and procedural management.",
    goals: [
      "Standardize committee reporting",
      "Improve accountability",
      "Support clear election communication"
    ],
    contact: "candidate4@smartcampus.edu"
  },
  {
    id: 5,
    name: "Maliha Sultana",
    department: "Economics",
    session: "2022-23",
    position: "Assistant General Secretary (AGS)",
    manifesto: "Support effective coordination and stronger operational follow-up.",
    bio: "Maliha is interested in administrative process improvement and student program logistics.",
    goals: [
      "Streamline meeting records",
      "Support cross-team coordination",
      "Improve follow-up systems"
    ],
    contact: "candidate5@smartcampus.edu"
  },
  {
    id: 6,
    name: "Rafiul Karim",
    department: "Political Science",
    session: "2021-22",
    position: "Secretary of Liberation War & Democratic Movement",
    manifesto: "Promote democratic awareness and historical respect across campus activities.",
    bio: "Rafiul frequently engages in awareness campaigns and student history forums.",
    goals: [
      "Organize heritage seminars",
      "Support democratic dialogue",
      "Promote civic awareness"
    ],
    contact: "candidate6@smartcampus.edu"
  },
  {
    id: 7,
    name: "Farhana Islam",
    department: "Information Technology",
    session: "2022-23",
    position: "Science & Technology Secretary",
    manifesto: "Modernize student technology resources and innovation platforms.",
    bio: "Farhana works on coding programs and student-led tech workshops.",
    goals: [
      "Launch campus hackathon support",
      "Expand digital literacy sessions",
      "Promote innovation clubs"
    ],
    contact: "candidate7@smartcampus.edu"
  },
  {
    id: 8,
    name: "Jubayer Hossain",
    department: "Physics",
    session: "2021-22",
    position: "Science & Technology Secretary",
    manifesto: "Connect science education with hands-on student opportunities.",
    bio: "Jubayer has organized science fairs and peer learning initiatives.",
    goals: [
      "Support research mini-events",
      "Increase lab awareness",
      "Promote science communication"
    ],
    contact: "candidate8@smartcampus.edu"
  },
  {
    id: 9,
    name: "Samia Noor",
    department: "International Relations",
    session: "2022-23",
    position: "International Secretary",
    manifesto: "Create stronger global engagement for local and international students.",
    bio: "Samia supports cross-cultural dialogue and student exchange programming.",
    goals: [
      "Increase international student inclusion",
      "Host cultural exchange sessions",
      "Improve global networking access"
    ],
    contact: "candidate9@smartcampus.edu"
  },
  {
    id: 10,
    name: "Arif Mahmud",
    department: "Bangla",
    session: "2021-22",
    position: "Literature & Cultural Secretary",
    manifesto: "Celebrate campus creativity through literature, arts, and cultural programs.",
    bio: "Arif writes, organizes campus recitations, and supports cultural activities.",
    goals: [
      "Host literary circles",
      "Expand cultural events",
      "Promote student talent"
    ],
    contact: "candidate10@smartcampus.edu"
  },
  {
    id: 11,
    name: "Ishrat Nawar",
    department: "Sociology",
    session: "2022-23",
    position: "Research & Publication Secretary",
    manifesto: "Strengthen academic publication and student research participation.",
    bio: "Ishrat is active in research clubs and student publications.",
    goals: [
      "Create student publication spaces",
      "Offer research guidance sessions",
      "Promote academic writing"
    ],
    contact: "candidate11@smartcampus.edu"
  },
  {
    id: 12,
    name: "Mahin Chowdhury",
    department: "Civil Engineering",
    session: "2021-22",
    position: "Student Transportation Secretary",
    manifesto: "Improve transport reliability and commuting support for students.",
    bio: "Mahin advocates for organized transport systems and safer travel planning.",
    goals: [
      "Address route concerns",
      "Promote transport scheduling awareness",
      "Collect commuter feedback"
    ],
    contact: "candidate12@smartcampus.edu"
  },
  {
    id: 13,
    name: "Raisa Ahmed",
    department: "Social Work",
    session: "2022-23",
    position: "Social Service Secretary",
    manifesto: "Expand student service and community outreach programs.",
    bio: "Raisa leads volunteer initiatives and social support projects.",
    goals: [
      "Increase volunteering opportunities",
      "Launch outreach events",
      "Strengthen social support programs"
    ],
    contact: "candidate13@smartcampus.edu"
  },
  {
    id: 14,
    name: "Hasib Anwar",
    department: "Management",
    session: "2021-22",
    position: "Career Development Secretary",
    manifesto: "Connect students to opportunities that improve career readiness.",
    bio: "Hasib supports career workshops, mentoring, and networking programs.",
    goals: [
      "Host career bootcamps",
      "Promote internship readiness",
      "Expand alumni engagement"
    ],
    contact: "candidate14@smartcampus.edu"
  },
  {
    id: 15,
    name: "Mrittika Dey",
    department: "Environmental Science",
    session: "2022-23",
    position: "Health & Environment Secretary",
    manifesto: "Build a healthier and greener campus environment.",
    bio: "Mrittika advocates for campus sustainability and wellness awareness.",
    goals: [
      "Promote clean campus initiatives",
      "Support health awareness campaigns",
      "Encourage eco-friendly habits"
    ],
    contact: "candidate15@smartcampus.edu"
  },
  {
    id: 16,
    name: "Siam Reza",
    department: "Law",
    session: "2021-22",
    position: "Human Rights & Law Secretary",
    manifesto: "Increase awareness of rights, fairness, and policy understanding.",
    bio: "Siam has experience in debate, legal literacy, and student rights discussions.",
    goals: [
      "Host rights awareness sessions",
      "Provide policy guidance resources",
      "Support fair grievance communication"
    ],
    contact: "candidate16@smartcampus.edu"
  },
  {
    id: 17,
    name: "Tasnia Ferdous",
    department: "Mass Communication",
    session: "2022-23",
    position: "Communication, Media & Cafeteria Secretary",
    manifesto: "Improve information flow, campus media, and daily student services.",
    bio: "Tasnia works in student media and promotes service transparency.",
    goals: [
      "Improve media announcements",
      "Promote cafeteria feedback",
      "Strengthen communication updates"
    ],
    contact: "candidate17@smartcampus.edu"
  },
  {
    id: 18,
    name: "Imran Kabir",
    department: "Physical Education",
    session: "2021-22",
    position: "Sports Secretary",
    manifesto: "Promote active student life through organized sports and fitness programs.",
    bio: "Imran supports tournaments, fitness campaigns, and sports participation.",
    goals: [
      "Expand sports access",
      "Organize inter-department matches",
      "Promote campus fitness events"
    ],
    contact: "candidate18@smartcampus.edu"
  },
  {
    id: 19,
    name: "Nadia Karim",
    department: "Mathematics",
    session: "2022-23",
    position: "Executive Committee Member",
    manifesto: "Represent student priorities with practical, solution-focused leadership.",
    bio: "Nadia is involved in student forums and academic collaboration activities.",
    goals: [
      "Listen to student concerns",
      "Support committee decisions",
      "Improve student feedback channels"
    ],
    contact: "candidate19@smartcampus.edu"
  },
  {
    id: 20,
    name: "Aminul Haque",
    department: "Marketing",
    session: "2021-22",
    position: "Executive Committee Member",
    manifesto: "Support efficient committee action and responsible representation.",
    bio: "Aminul has worked in student event management and coordination.",
    goals: [
      "Promote operational efficiency",
      "Support student representation",
      "Encourage teamwork"
    ],
    contact: "candidate20@smartcampus.edu"
  },
  {
    id: 21,
    name: "Sadia Haq",
    department: "Public Health",
    session: "2022-23",
    position: "Executive Committee Member",
    manifesto: "Contribute to a safer, healthier, and more responsive campus environment.",
    bio: "Sadia supports wellness campaigns and student engagement activities.",
    goals: [
      "Strengthen student communication",
      "Support wellness planning",
      "Encourage inclusive representation"
    ],
    contact: "candidate21@smartcampus.edu"
  }
];

const notices = [
  {
    id: 1,
    title: "Nomination Form Submission Deadline Extended",
    category: "Deadline",
    date: "2026-04-05",
    summary: "The election office has extended the nomination form submission deadline by two days.",
    details: "Students interested in contesting may now submit nomination forms until 5:00 PM on April 5, 2026. All previously announced documentation requirements remain unchanged."
  },
  {
    id: 2,
    title: "Candidate Verification Process Begins",
    category: "Verification",
    date: "2026-04-07",
    summary: "Initial document verification for submitted candidates will begin this week.",
    details: "The verification committee will review academic, disciplinary, and eligibility documents. Candidates are advised to keep their sample profile information updated."
  },
  {
    id: 3,
    title: "Official Candidate List Publication",
    category: "Announcement",
    date: "2026-04-10",
    summary: "The approved candidate list will be published on the candidate directory page.",
    details: "After the verification process, the official candidate list will be displayed on the Candidates page along with position information and profile access."
  },
  {
    id: 4,
    title: "Campaign Guidelines Released",
    category: "Policy",
    date: "2026-04-11",
    summary: "Candidates must follow approved communication standards during the campaign period.",
    details: "Campaign content must remain respectful, factual, and free from harassment. Digital campaign communication should remain within approved campus channels."
  },
  {
    id: 5,
    title: "Voting Schedule Confirmed",
    category: "Schedule",
    date: "2026-04-18",
    summary: "The election office has confirmed the official voting and result publication dates.",
    details: "Voting will open on April 18 at 9:00 AM and continue until April 19 at 4:00 PM. Preliminary results will be published after system review and approval."
  }
];

const electionTimeline = [
  {
    stage: "Election Notice Published",
    date: "2026-04-01",
    description: "The official election announcement is released to all students."
  },
  {
    stage: "Nomination Submission Opens",
    date: "2026-04-02",
    description: "Interested candidates begin submitting nomination forms."
  },
  {
    stage: "Nomination Submission Closes",
    date: "2026-04-05",
    description: "Final deadline for all candidate submissions and supporting documents."
  },
  {
    stage: "Verification & Review",
    date: "2026-04-07",
    description: "Election office verifies candidate information and eligibility."
  },
  {
    stage: "Official Candidate List Published",
    date: "2026-04-10",
    description: "Approved candidates are announced publicly."
  },
  {
    stage: "Campaign Period",
    date: "2026-04-11 to 2026-04-17",
    description: "Candidates share manifesto and campaign goals through approved channels."
  },
  {
    stage: "Voting Period",
    date: "2026-04-18 to 2026-04-19",
    description: "Students cast their votes through the online platform."
  },
  {
    stage: "Counting & Review",
    date: "2026-04-20",
    description: "Votes are counted and reviewed by the election committee."
  },
  {
    stage: "Result Publication",
    date: "2026-04-21",
    description: "Final election results are officially published."
  }
];