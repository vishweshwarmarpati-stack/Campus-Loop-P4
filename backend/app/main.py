from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import (
    User,
    Club,
    Event,
    Registration,
    Attendance,
    ClubMembership,
    Contribution,
    Notification,
    Announcement,
)

from .seed import seed_database


app = FastAPI(
    title="CampusLoop Security Platform",
    description="CampusLoop campus community and participation platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventCreate(BaseModel):
    club_id: int
    title: str
    description: str
    date: str
    time: str
    venue: str
    capacity: int


class AttendanceVerification(BaseModel):
    code: str


class AnnouncementCreate(BaseModel):
    club_id: int
    title: str
    message: str


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_database()


@app.get("/")
def root():
    return {
        "message": "CampusLoop API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CampusLoop API",
    }


# =========================================================
# DEMO AUTHENTICATION
# =========================================================

@app.get("/auth/demo/student")
def demo_student_login(
    db: Session = Depends(get_db),
):
    """
    Hackathon demo login.

    This intentionally does not use passwords or JWT yet.
    It selects the seeded student account.
    """
    user = db.query(User).filter(
        User.id == 1
    ).first()

    if not user:
        return {
            "error": "Demo student account not found"
        }

    return {
        "message": "Student demo login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "student",
        },
    }


@app.get("/auth/demo/admin")
def demo_admin_login(
    db: Session = Depends(get_db),
):
    """
    Hackathon demo club-admin login.

    This intentionally does not use passwords or JWT yet.
    It selects the seeded admin account.
    """
    user = db.query(User).filter(
        User.id == 2
    ).first()

    if not user:
        return {
            "error": "Demo admin account not found"
        }

    return {
        "message": "Club admin demo login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": "club_admin",
            "club_id": 1,
            "club_name": "AI Nexus",
        },
    }


# =========================================================
# CLUBS
# =========================================================

@app.get("/clubs")
def get_clubs(db: Session = Depends(get_db)):
    clubs = db.query(Club).all()

    return [
        {
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "description": club.description,
            "members": club.members,
        }
        for club in clubs
    ]


@app.get("/clubs/{club_id}")
def get_club(
    club_id: int,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    return {
        "id": club.id,
        "name": club.name,
        "category": club.category,
        "description": club.description,
        "members": club.members,
    }


@app.post("/clubs/{club_id}/join")
def join_club(
    club_id: int,
    db: Session = Depends(get_db),
):
    user_id = 1

    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    existing = db.query(ClubMembership).filter(
        ClubMembership.user_id == user_id,
        ClubMembership.club_id == club_id,
    ).first()

    if existing:
        return {
            "error": "You are already a member of this club."
        }

    membership = ClubMembership(
        user_id=user_id,
        club_id=club_id,
    )

    db.add(membership)

    club.members += 1

    notification = Notification(
        user_id=user_id,
        title="Club joined",
        message=f"You joined {club.name}. Welcome to the community!",
        notification_type="club",
        is_read=0,
    )

    db.add(notification)

    db.commit()

    return {
        "message": f"You joined {club.name}!",
        "club_id": club.id,
    }


# =========================================================
# CLUB ANNOUNCEMENTS
# =========================================================

@app.get("/clubs/{club_id}/announcements")
def get_club_announcements(
    club_id: int,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    announcements = (
        db.query(Announcement)
        .filter(Announcement.club_id == club_id)
        .order_by(Announcement.id.desc())
        .all()
    )

    return {
        "club": {
            "id": club.id,
            "name": club.name,
        },
        "announcements": [
            {
                "id": announcement.id,
                "title": announcement.title,
                "message": announcement.message,
                "created_by": announcement.created_by,
            }
            for announcement in announcements
        ],
    }


# =========================================================
# EVENTS
# =========================================================

@app.get("/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()

    return [
        {
            "id": event.id,
            "club_id": event.club_id,
            "title": event.title,
            "description": event.description,
            "date": event.date,
            "time": event.time,
            "venue": event.venue,
            "capacity": event.capacity,
            "registered": event.registered,
        }
        for event in events
    ]


@app.get("/events/{event_id}")
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        return {
            "error": "Event not found"
        }

    return {
        "id": event.id,
        "club_id": event.club_id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "time": event.time,
        "venue": event.venue,
        "capacity": event.capacity,
        "registered": event.registered,
    }


@app.post("/events/{event_id}/register")
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
):
    user_id = 1

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        return {
            "error": "Event not found"
        }

    existing = db.query(Registration).filter(
        Registration.user_id == user_id,
        Registration.event_id == event_id,
    ).first()

    if existing:
        return {
            "error": "You are already registered for this event."
        }

    if event.registered >= event.capacity:
        return {
            "error": "This event is full."
        }

    registration = Registration(
        user_id=user_id,
        event_id=event_id,
        status="Registered",
    )

    db.add(registration)

    event.registered += 1

    notification = Notification(
        user_id=user_id,
        title="Event registration confirmed",
        message=(
            f"You are registered for {event.title}. "
            f"{event.date} · {event.time} · {event.venue}"
        ),
        notification_type="registration",
        is_read=0,
    )

    db.add(notification)

    db.commit()

    return {
        "message": "You registered for the event!",
        "event_id": event.id,
    }


# =========================================================
# ATTENDANCE
# =========================================================

@app.get("/attendance/{event_id}/code")
def get_attendance_code(
    event_id: int,
    db: Session = Depends(get_db),
):
    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        return {
            "error": "Event not found"
        }

    code = f"CL-{event.id:04d}"

    return {
        "event_id": event.id,
        "code": code,
    }


@app.post("/attendance/{event_id}/verify")
def verify_attendance(
    event_id: int,
    payload: AttendanceVerification,
    db: Session = Depends(get_db),
):
    user_id = 1

    event = db.query(Event).filter(
        Event.id == event_id
    ).first()

    if not event:
        return {
            "error": "Event not found"
        }

    expected_code = f"CL-{event.id:04d}"

    if payload.code.strip().upper() != expected_code:
        return {
            "error": "Invalid attendance code."
        }

    registration = db.query(Registration).filter(
        Registration.user_id == user_id,
        Registration.event_id == event_id,
    ).first()

    if not registration:
        return {
            "error": "You must register for this event before verifying attendance."
        }

    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.event_id == event_id,
    ).first()

    if existing:
        return {
            "error": "Your attendance is already verified."
        }

    attendance = Attendance(
        user_id=user_id,
        event_id=event_id,
        status="Verified",
    )

    db.add(attendance)

    notification = Notification(
        user_id=user_id,
        title="Attendance verified",
        message=(
            f"Your participation in {event.title} "
            f"has been verified and added to your campus passport."
        ),
        notification_type="attendance",
        is_read=0,
    )

    db.add(notification)

    db.commit()

    return {
        "message": "Attendance verified successfully!",
        "event_id": event.id,
        "status": "Verified",
    }


# =========================================================
# STUDENT PROFILE
# =========================================================



@app.get("/students/{user_id}/passport")
def get_student_passport(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # Only VERIFIED attendance becomes participation.
    verified_attendance = (
        db.query(Attendance, Event, Club)
        .join(
            Event,
            Attendance.event_id == Event.id
        )
        .join(
            Club,
            Event.club_id == Club.id
        )
        .filter(
            Attendance.user_id == user_id,
            Attendance.status == "Verified"
        )
        .all()
    )

    verified_events = []

    for attendance, event, club in verified_attendance:
        verified_events.append({
            "event_id": event.id,
            "event_title": event.title,
            "club_id": club.id,
            "club_name": club.name,
            "date": event.date,
            "time": event.time,
            "venue": event.venue,
            "status": "Verified",
        })

    contributions = (
        db.query(Contribution, Club)
        .join(
            Club,
            Contribution.club_id == Club.id
        )
        .filter(
            Contribution.user_id == user_id
        )
        .order_by(
            Contribution.id.desc()
        )
        .all()
    )

    contribution_list = []

    for contribution, club in contributions:
        contribution_list.append({
            "id": contribution.id,
            "title": contribution.title,
            "description": contribution.description,
            "club_id": club.id,
            "club_name": club.name,
        })

    memberships = (
        db.query(ClubMembership, Club)
        .join(
            Club,
            ClubMembership.club_id == Club.id
        )
        .filter(
            ClubMembership.user_id == user_id
        )
        .all()
    )

    clubs = []

    for membership, club in memberships:
        clubs.append({
            "club_id": club.id,
            "club_name": club.name,
            "category": club.category,
            "board_role": membership.board_role,
        })

    return {
        "student": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
        "stats": {
            "clubs_joined": len(clubs),
            "verified_events": len(verified_events),
            "contributions": len(contribution_list),
        },
        "clubs": clubs,
        "verified_events": verified_events,
        "contributions": contribution_list,
        "verification": {
            "verified_events_count": len(verified_events),
            "description": (
                "Participation shown here is based on "
                "verified attendance records."
            ),
        },
    }


@app.get("/students/{user_id}/profile")
def get_student_profile(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "error": "Student not found"
        }

    memberships = db.query(ClubMembership).filter(
        ClubMembership.user_id == user_id
    ).all()

    clubs = []

    for membership in memberships:
        club = db.query(Club).filter(
            Club.id == membership.club_id
        ).first()

        if club:
            clubs.append({
                "id": club.id,
                "name": club.name,
                "category": club.category,
            })

    registrations = db.query(Registration).filter(
        Registration.user_id == user_id
    ).all()

    registered_events = []

    for registration in registrations:
        event = db.query(Event).filter(
            Event.id == registration.event_id
        ).first()

        if event:
            registered_events.append({
                "id": event.id,
                "title": event.title,
                "date": event.date,
                "time": event.time,
                "venue": event.venue,
                "status": registration.status,
            })

    attendances = db.query(Attendance).filter(
        Attendance.user_id == user_id
    ).all()

    verified_events = []

    for attendance in attendances:
        event = db.query(Event).filter(
            Event.id == attendance.event_id
        ).first()

        if event:
            verified_events.append({
                "id": event.id,
                "title": event.title,
                "date": event.date,
                "venue": event.venue,
                "status": attendance.status,
            })

    contributions_db = db.query(Contribution).filter(
        Contribution.user_id == user_id
    ).all()

    contributions = [
        {
            "id": contribution.id,
            "title": contribution.title,
            "description": contribution.description,
        }
        for contribution in contributions_db
    ]

    return {
        "student": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },

        "clubs": clubs,

        "registered_events": registered_events,

        "verified_events": verified_events,

        "contributions": contributions,

        "stats": {
            "clubs_joined": len(clubs),
            "events_registered": len(registered_events),
            "events_attended": len(verified_events),
            "contributions": len(contributions),
        },
    }


# =========================================================
# NOTIFICATIONS
# =========================================================

@app.get("/students/{user_id}/notifications")
def get_notifications(
    user_id: int,
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.id.desc())
        .all()
    )

    return {
        "notifications": [
            {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.notification_type,
                "is_read": bool(notification.is_read),
            }
            for notification in notifications
        ],
        "unread_count": sum(
            1
            for notification in notifications
            if not notification.is_read
        ),
    }


@app.post(
    "/students/{user_id}/notifications/{notification_id}/read"
)
def mark_notification_read(
    user_id: int,
    notification_id: int,
    db: Session = Depends(get_db),
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id,
    ).first()

    if not notification:
        return {
            "error": "Notification not found"
        }

    notification.is_read = 1

    db.commit()

    return {
        "message": "Notification marked as read.",
        "notification_id": notification.id,
    }


@app.post(
    "/students/{user_id}/notifications/read-all"
)
def mark_all_notifications_read(
    user_id: int,
    db: Session = Depends(get_db),
):
    notifications = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == 0,
    ).all()

    for notification in notifications:
        notification.is_read = 1

    db.commit()

    return {
        "message": "All notifications marked as read.",
        "count": len(notifications),
    }


# =========================================================
# CLUB ADMIN DASHBOARD
# =========================================================

@app.get("/admin/clubs/{club_id}/dashboard")
def admin_dashboard(
    club_id: int,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    events = db.query(Event).filter(
        Event.club_id == club_id
    ).all()

    announcements = (
        db.query(Announcement)
        .filter(Announcement.club_id == club_id)
        .order_by(Announcement.id.desc())
        .all()
    )

    event_data = []

    total_registrations = 0
    total_verified = 0

    for event in events:
        registrations = db.query(Registration).filter(
            Registration.event_id == event.id
        ).count()

        verified = db.query(Attendance).filter(
            Attendance.event_id == event.id
        ).count()

        total_registrations += registrations
        total_verified += verified

        event_data.append({
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "date": event.date,
            "time": event.time,
            "venue": event.venue,
            "capacity": event.capacity,
            "registered": event.registered,
            "attendance_code": f"CL-{event.id:04d}",
        })

    announcement_data = [
        {
            "id": announcement.id,
            "title": announcement.title,
            "message": announcement.message,
            "created_by": announcement.created_by,
        }
        for announcement in announcements
    ]

    return {
        "club": {
            "id": club.id,
            "name": club.name,
            "category": club.category,
            "description": club.description,
        },

        "stats": {
            "members": club.members,
            "events": len(events),
            "registrations": total_registrations,
            "verified_attendance": total_verified,
            "announcements": len(announcements),
        },

        "events": event_data,

        "announcements": announcement_data,
    }


# =========================================================
# CLUB MEMBER MANAGEMENT
# =========================================================

@app.get("/admin/clubs/{club_id}/members")
def get_club_members(
    club_id: int,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    memberships = (
        db.query(ClubMembership)
        .filter(ClubMembership.club_id == club_id)
        .all()
    )

    members = []

    for membership in memberships:
        user = db.query(User).filter(
            User.id == membership.user_id
        ).first()

        if not user:
            continue

        members.append({
            "membership_id": membership.id,
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "board_role": membership.board_role,
        })

    return {
        "club": {
            "id": club.id,
            "name": club.name,
        },
        "member_count": len(members),
        "members": members,
    }


@app.put("/admin/clubs/{club_id}/members/{user_id}/role")
def update_member_board_role(
    club_id: int,
    user_id: int,
    board_role: str,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    membership = (
        db.query(ClubMembership)
        .filter(
            ClubMembership.club_id == club_id,
            ClubMembership.user_id == user_id,
        )
        .first()
    )

    if not membership:
        return {
            "error": "User is not a member of this club"
        }

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        return {
            "error": "User not found"
        }

    allowed_roles = [
        "General Member",
        "President",
        "Vice President",
        "Secretary",
        "Treasurer",
        "Event Coordinator",
        "Technical Lead",
        "Design Lead",
        "Marketing Lead",
    ]

    if board_role not in allowed_roles:
        return {
            "error": "Invalid board role",
            "allowed_roles": allowed_roles,
        }

    # Prevent two members from holding the same leadership position.
    if board_role != "General Member":
        existing_role = (
            db.query(ClubMembership)
            .filter(
                ClubMembership.club_id == club_id,
                ClubMembership.board_role == board_role,
                ClubMembership.user_id != user_id,
            )
            .first()
        )

        if existing_role:
            existing_user = db.query(User).filter(
                User.id == existing_role.user_id
            ).first()

            return {
                "error": "Role already assigned",
                "board_role": board_role,
                "assigned_to": (
                    existing_user.name
                    if existing_user
                    else "Another member"
                ),
            }

    membership.board_role = board_role

    db.commit()
    db.refresh(membership)

    return {
        "message": "Board role updated successfully",
        "club": {
            "id": club.id,
            "name": club.name,
        },
        "member": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "board_role": membership.board_role,
        },
    }



# =========================================================
# CREATE EVENT
# =========================================================

@app.post("/admin/events")
def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
):
    club = db.query(Club).filter(
        Club.id == event_data.club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    event = Event(
        club_id=event_data.club_id,
        title=event_data.title,
        description=event_data.description,
        date=event_data.date,
        time=event_data.time,
        venue=event_data.venue,
        capacity=event_data.capacity,
        registered=0,
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return {
        "message": "Event created successfully!",
        "event": {
            "id": event.id,
            "title": event.title,
            "attendance_code": f"CL-{event.id:04d}",
        },
    }


# =========================================================
# ADMIN ANNOUNCEMENTS
# =========================================================

@app.post("/admin/announcements")
def create_announcement(
    announcement_data: AnnouncementCreate,
    db: Session = Depends(get_db),
):
    admin_user_id = 2

    club = db.query(Club).filter(
        Club.id == announcement_data.club_id
    ).first()

    if not club:
        return {
            "error": "Club not found"
        }

    title = announcement_data.title.strip()
    message = announcement_data.message.strip()

    if not title:
        return {
            "error": "Announcement title is required."
        }

    if not message:
        return {
            "error": "Announcement message is required."
        }

    announcement = Announcement(
        club_id=announcement_data.club_id,
        title=title,
        message=message,
        created_by=admin_user_id,
    )

    db.add(announcement)

    members = db.query(ClubMembership).filter(
        ClubMembership.club_id == announcement_data.club_id
    ).all()

    for membership in members:
        notification = Notification(
            user_id=membership.user_id,
            title=f"{club.name}: {title}",
            message=message,
            notification_type="announcement",
            is_read=0,
        )

        db.add(notification)

    db.commit()
    db.refresh(announcement)

    return {
        "message": "Announcement published successfully!",
        "announcement": {
            "id": announcement.id,
            "club_id": announcement.club_id,
            "title": announcement.title,
            "message": announcement.message,
        },
        "notifications_sent": len(members),
    }