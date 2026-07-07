# 👁️ SightSpoke

### Visual Preference Testing Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📋 Overview

**SightSpoke** is a **privacy-first, image-based selection platform** designed to capture visual preferences and decision-making patterns through timed image selection exercises.

It captures:
- 🎯 **What** users choose
- ⏱️ **How quickly** they choose  
- 🔄 **How consistently** they choose

These structured signals form the foundation for behavioral insight, role alignment, and pattern analysis.

---

## ✨ Key Features

### 🔐 Privacy First
- No email requirement or tracking scripts
- No personal data collection
- Anonymous participant experience
- Self-hosted deployment ready

### 🎮 Mechanical Input
- Image-based selection only
- No subjective text input
- Timed decision capture

### ⚡ Speed & Simplicity
- 3-5 minute test duration
- Clean, minimal interface
- Mobile-first responsive design

### 🛠️ Admin Control
- Create and manage quizzes
- Upload images with metadata
- Configure time limits and layouts
- Generate anonymous participant links
- Export JSON/CSV data for AI analysis

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion, Chart.js |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, JWT |
| **Database** | PostgreSQL 17 |
| **Auth** | JWT + SHA256 |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 17+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/aurabydaniyal/sightspoke.git
cd sightspoke