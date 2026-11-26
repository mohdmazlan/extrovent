# Extrovent Backend API

OOP PHP backend for the Extrovent Android app, replacing the legacy `android_php/` system.

## Quick Start

```bash
cd backend
composer install
cp .env.example .env
# Edit .env with your database credentials
php -S localhost:8080 public/index.php
```

## Directory Structure

```
backend/
├── composer.json          # Dependencies & autoloader
├── .env.example           # Environment config template
├── .env                   # Your local config (gitignored)
├── public/
│   └── index.php          # Single entry point — all routes go here
├── src/
│   ├── Application.php    # Bootstrap, env loader, DI container
│   ├── Database.php       # PDO wrapper with prepared statements
│   ├── Request.php        # Request wrapper (POST/GET/file)
│   ├── Response.php       # JSON response envelope
│   ├── Auth.php           # Authentication middleware
│   └── Entities/          # Business logic per domain
│       ├── Entity.php     # Base entity class
│       ├── User.php       # Auth, profiles, search users
│       ├── Event.php      # CRUD, ratings, likes, participants
│       ├── Place.php      # CRUD, ratings
│       ├── Activity.php   # CRUD, ratings
│       ├── Post.php       # CRUD, likes, comments
│       ├── BusinessProfile.php  # CRUD, updates
│       ├── Chatroom.php   # Rooms, messages
│       ├── Friend.php     # Requests, accept/reject
│       ├── Search.php     # Unified search
│       └── MediaUpload.php # Generic file upload handler
├── routes/                # Thin route handlers (one per entity group)
│   ├── AuthRoute.php
│   ├── UserRoute.php
│   ├── EventRoute.php
│   ├── PlaceRoute.php
│   ├── ActivityRoute.php
│   ├── PostRoute.php
│   ├── BusinessRoute.php
│   ├── ChatroomRoute.php
│   ├── FriendRoute.php
│   ├── SearchRoute.php
│   ├── NotificationRoute.php
│   ├── HealthRoute.php      # Health check (no DB needed)
│   └── MediaRoute.php       # File serving
├── uploads/               # File storage — outside public, not web-accessible
│   └── .htaccess          # Blocks direct access
├── swagger/
│   └── openapi.yaml       # API documentation spec
└── storage/               # Logs, cache (reserved)
```

## Database Setup

1. Create the database using the existing `outdoorbuddy.sql` schema
2. Update `.env` with your MySQL credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=outdoorbuddy
   DB_USER=root
   DB_PASS=
   ```

## API Endpoints

All endpoints are accessed via `http://localhost:8080/api/<route>`.

### Authentication
All protected endpoints require an `Authorization: Bearer <access_token>` header. Obtain tokens from `/auth/login`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/auth/signup` | Register new user |
| POST   | `/auth/login` | Login, returns JWT `access_token` and `refresh_token` |
| POST   | `/auth/refresh` | Refresh tokens using a valid `refresh_token` |
| POST   | `/auth/logout` | Logout, blacklists current token (requires Bearer token) |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/user/profile` | Get profile (requires auth) |
| PUT    | `/user/update` | Update profile (requires auth) |
| PUT    | `/user/update-profile-pic` | Upload avatar (requires auth + file) |
| GET    | `/user/search` | Search users (requires auth) |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/event/create` | Create event (requires auth) |
| GET    | `/event/list` | Get all events (optional `place_id`) |
| GET    | `/event/get` | Get single event by ID |
| PUT    | `/event/update` | Update event (requires auth + ownership) |
| DELETE | `/event/delete` | Delete event (requires auth + ownership) |
| POST   | `/event/like` | Like/unlike event (requires auth) |
| POST   | `/event/join` | Join an event (requires auth) |
| POST   | `/event/upload-image` | Upload event images (requires auth + file) |

### Places
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/place/create` | Create place (requires auth) |
| GET    | `/place/list` | Get all places (optional `category`) |
| PUT    | `/place/update` | Update place (requires auth + ownership) |
| DELETE | `/place/delete` | Delete place (requires auth + ownership) |
| POST   | `/place/upload-image` | Upload place images (requires auth + file) |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/activity/create` | Create activity (requires auth) |
| GET    | `/activity/list` | Get all activities |
| DELETE | `/activity/delete` | Delete activity (requires auth + ownership) |
| POST   | `/activity/upload-image` | Upload activity images (requires auth + file) |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/post/create` | Create post (requires auth) |
| GET    | `/post/list` | Get posts (with optional filters) |
| POST   | `/post/like` | Like/unlike post (requires auth) |
| POST   | `/post/comment` | Comment on post (requires auth) |
| DELETE | `/post/delete` | Delete post (requires auth + ownership) |
| POST   | `/post/upload-image` | Upload post images (requires auth + file) |
| POST   | `/post/upload-banner` | Upload post banner (requires auth + file) |

### Business Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/business/register` | Register business (requires auth) |
| GET    | `/business/list` | Get all approved businesses |
| PUT    | `/business/update` | Update business (requires auth + ownership) |
| PUT    | `/business/update-banner` | Upload banner (requires auth + file) |
| PUT    | `/business/update-pic` | Upload profile pic (requires auth + file) |

### Chatroom
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/chatroom/create` | Create chatroom (requires auth) |
| POST   | `/chatroom/message` | Send message (auto-creates room) |
| GET    | `/chatroom/list` | Get chatrooms (requires auth) |
| GET    | `/chatroom/messages` | Get messages for a room |
| POST   | `/chatroom/group-message` | Send to group chat (requires auth) |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/friend/request` | Send friend request (requires auth) |
| GET    | `/friend/requests` | Get pending requests (requires auth) |
| PUT    | `/friend/accept` | Accept request (requires auth) |
| GET    | `/friend/list` | Get friends list (requires auth) |
| GET    | `/friend/check` | Check friendship (requires auth) |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/search?q=...` | Unified search across all entities |

### Media / Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/media/{type}/{path}` | Serve uploaded files |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/notification` | Get notifications (requires auth) |

## Response Format

All responses follow a consistent envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Validation error message",
  "details": { ... }
}
```

## File Uploads

All image uploads go through the `MediaUpload` entity and store files in `backend/uploads/`:

```
uploads/
├── avatars/          → user profile pictures
├── events/           → event images
├── places/           → place images
├── activities/       → activity images
├── posts/            → post images & banners
└── business/         → business profile pics & banners
```

Files are served via `GET /media/{type}/{filename}`. The uploads directory is outside the public web root and blocked by `.htaccess`.

## Migration from Legacy API

The new API uses JWT Bearer token authentication:
- Login via `/auth/login` returns `access_token` and `refresh_token`
- Send `Authorization: Bearer <access_token>` on all protected endpoints
- Same JSON response structure as `android_php/`

The Android app must be updated to use Bearer tokens — see the separate Android migration change.

## Development

```bash
# Install dependencies
composer install

# Run development server
php -S localhost:8080 public/index.php

# Test with curl
curl -X POST http://localhost:8080/api/health
```

## Swagger/OpenAPI

The full API specification is in `swagger/openapi.yaml`. View it at https://editor.swagger.io/ or run a local Swagger UI server.

## Security Notes

- Passwords are hashed with bcrypt (not md5 like the legacy system)
- All database queries use prepared statements (no SQL injection risk)
- Uploads are stored outside the public directory
- `Authorization: Bearer <access_token>` is required for protected endpoints
- File uploads validate MIME type, size (max 5MB), and extension
- Directory traversal protection on media serving
