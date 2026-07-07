# SightSpoke Database

## Database Information

- **Database**: PostgreSQL 14+
- **ORM**: SQLAlchemy (for Python backend)
- **Schema File**: `schema.sql`
- **Seed Data**: `seed.sql`

## Setup Instructions

### 1. Install PostgreSQL
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/


---

### Create `.env.example`

Create `database/.env.example`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sightspoke
DB_USER=postgres
DB_PASSWORD=your_password_here

# Security
JWT_SECRET_KEY=your_secret_key_change_in_production
ADMIN_PASSWORD_HASH=your_bcrypt_hash

# Token Settings
TOKEN_EXPIRY_DAYS=7
MAX_TOKENS_PER_QUIZ=1000

# File Upload
MAX_IMAGE_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=./uploads/images
ALLOWED_EXTENSIONS=.jpg,.jpeg,.png,.webp