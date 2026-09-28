from .database import SessionLocal, engine, Base
from .models import (
    User,
    Club,
    Event,
    ClubMembership,
    Contribution
)


def seed_database():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Prevent duplicate seed data
    if db.query(User).count() > 0:
        db.close()
        return

    # -------------------------
    # USERS
    # -------------------------

    student = User(
        name="Rahul Kumar",
        email="rahul@campusloop.com",
        role="student"
    )

    admin = User(
        name="Ananya Sharma",
        email="ananya@campusloop.com",
        role="club_admin"
    )

    db.add_all([student, admin])
    db.commit()

    # -------------------------
    # CLUBS
    # -------------------------

    ai_club = Club(
        name="AI Nexus",
        category="AI & Machine Learning",
        description=(
            "A community for students interested in Artificial Intelligence, "
            "Machine Learning, Generative AI and research."
        ),
        members=120
    )

    coding = Club(
        name="Coding Club",
        category="Programming",
        description=(
            "A student community focused on competitive programming, "
            "software development and hackathons."
        ),
        members=180
    )

    robotics = Club(
        name="Robotics Society",
        category="Robotics",
        description=(
            "Students building robots, autonomous systems and hardware projects."
        ),
        members=95
    )

    db.add_all([ai_club, coding, robotics])
    db.commit()

    # -------------------------
    # EVENTS
    # -------------------------

    events = [
        Event(
            club_id=ai_club.id,
            title="AI Hackathon 2026",
            description="Build innovative AI solutions in a 24-hour hackathon.",
            date="28 Sep 2026",
            time="09:00 AM",
            venue="Innovation Lab",
            capacity=100,
            registered=64
        ),
        Event(
            club_id=coding.id,
            title="Git & GitHub Workshop",
            description="Learn Git, GitHub and collaborative development.",
            date="30 Sep 2026",
            time="02:00 PM",
            venue="Seminar Hall",
            capacity=80,
            registered=42
        ),
        Event(
            club_id=robotics.id,
            title="Robotics Expo",
            description="Explore student-built robots and autonomous systems.",
            date="03 Oct 2026",
            time="10:00 AM",
            venue="Main Auditorium",
            capacity=150,
            registered=91
        )
    ]

    db.add_all(events)
    db.commit()

    # -------------------------
    # SAMPLE MEMBERSHIP
    # -------------------------

    membership = ClubMembership(
        user_id=student.id,
        club_id=ai_club.id
    )

    db.add(membership)

    # -------------------------
    # SAMPLE CONTRIBUTION
    # -------------------------

    contribution = Contribution(
        user_id=student.id,
        club_id=ai_club.id,
        title="Hackathon Volunteer",
        description="Helped organize the AI Hackathon."
    )

    db.add(contribution)

    db.commit()
    db.close()

    print("CampusLoop database seeded successfully!")


if __name__ == "__main__":
    seed_database()
