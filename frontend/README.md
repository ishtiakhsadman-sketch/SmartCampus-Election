# 🎨 SmartCampus Election - Frontend Client

## Project Overview

This directory contains the responsive, dynamic frontend of the **SmartCampus Election** system, built using modern **HTML5**, **CSS3**, and **Vanilla JavaScript**.

While previously a frontend-only simulation, this client has been fully integrated with a Node.js & Express REST API backed by MongoDB to provide a secure, real-time election platform. Local storage is now primarily used for managing active session tokens and user badges, with core application state persisting securely in the database.

It supports a comprehensive range of features across four distinct user roles:

- public visitors
- students/voters
- candidates
- administrators

---

## Features

### Public Features
- responsive homepage
- about page
- election positions listing
- candidate directory with search, filter, and sorting
- candidate profile page
- election schedule/timeline
- official notices page
- FAQ page
- contact page
- login, registration, and password reset interfaces

### Student Features
- student dashboard
- student profile edit form
- ballot selection flow
- ballot review page
- vote submission success page
- results viewing page
- vote lock after final submission

### Candidate Features
- candidate dashboard
- nomination form
- candidate profile management
- campaign preview page

### Admin Features
- admin dashboard
- election setup page
- positions management
- candidates review and approval simulation
- voters management
- ballot configuration
- notices management
- results management and publication simulation
- audit log interface

---

## File / Folder Structure

```text
frontend/
│
├── index.html
├── about.html
├── positions.html
├── candidates.html
├── candidate-profile.html
├── schedule.html
├── notices.html
├── faq.html
├── contact.html
├── login.html
├── register.html
├── forgot-password.html
│
├── student-dashboard.html
├── student-profile.html
├── student-candidates.html
├── student-candidate-profile.html
├── ballot.html
├── review-ballot.html
├── vote-success.html
├── results.html
│
├── candidate-dashboard.html
├── nomination.html
├── candidate-manage-profile.html
├── candidate-campaign.html
│
├── admin-dashboard.html
├── election-setup.html
├── admin-positions.html
├── admin-candidates.html
├── admin-voters.html
├── admin-ballot.html
├── admin-notices.html
├── admin-results.html
├── admin-audit-log.html
├── admin-contact-messages.html
│
└── assets/
    ├── css/
    │   ├── style.css
    │   ├── responsive.css
    │   ├── forms.css
    │   ├── dashboard.css
    │   └── tables.css
    │
    └── js/
        ├── api.js            # Express API Helper integration
        ├── mock-data.js      # Mock fallback configurations
        ├── main.js
        ├── auth.js           # Full-stack registration, login & OTP verification
        ├── candidates.js     # Candidates profiles and biography manager
        ├── notices.js        # Bulletin notices reader
        ├── ballot.js         # Secure voting flow controller
        ├── results.js        # Graphical results renderer
        └── admin.js          # Admin dashboard & logs operations
```