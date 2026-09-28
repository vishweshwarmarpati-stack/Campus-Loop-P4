import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  Users,
  CalendarDays,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MapPin,
  Clock,
  UserPlus,
  Award,
  ShieldCheck,
  Trophy,
  ChevronRight,
  LayoutDashboard,
  Plus,
  BarChart3,
  ClipboardCheck,
  X,
  KeyRound,
  Copy,
  Check,
  QrCode,
  Bell,
  Megaphone,
  Crown,
  UserCog,
  LogOut,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const demoUser = {
      id: 1,
      name: "Rahul Kumar",
      email: "rahul@campusloop.com",
      role: "student",
    };

    const savedUser = localStorage.getItem("campusloop_user");

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);

        if (
          parsedUser &&
          typeof parsedUser === "object" &&
          parsedUser.id &&
          parsedUser.name &&
          parsedUser.email &&
          parsedUser.role
        ) {
          return parsedUser;
        }
      } catch {
        // Invalid saved session — use demo user.
      }
    }

    localStorage.setItem(
      "campusloop_user",
      JSON.stringify(demoUser)
    );

    return demoUser;
  });

  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("home");
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [attendanceEvent, setAttendanceEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [joinedClubs, setJoinedClubs] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [clubAnnouncements, setClubAnnouncements] = useState([]);

  const handleDemoLogin = async (role) => {
    try {
      const endpoint =
        role === "club_admin"
          ? `${API}/auth/demo/admin`
          : `${API}/auth/demo/student`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage(
          data.error ||
            "Could not start the demo session."
        );
        return;
      }

      localStorage.setItem(
        "campusloop_user",
        JSON.stringify(data.user)
      );

      setCurrentUser(data.user);

      setView(
        data.user.role === "club_admin"
          ? "admin"
          : "home"
      );
    } catch {
      setMessage(
        "Could not connect to the CampusLoop backend."
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(
      "campusloop_user"
    );

    setCurrentUser(null);
    setView("home");
    setSelectedClub(null);
    setSelectedEvent(null);
    setShowNotifications(false);
  };

  const loadData = () => {
    fetch(`${API}/clubs`)
      .then((res) => res.json())
      .then(setClubs)
      .catch(() => setMessage("Backend is not running"));

    fetch(`${API}/events`)
      .then((res) => res.json())
      .then(setEvents)
      .catch(() => setMessage("Backend is not running"));
  };

  const loadStudentState = () => {
    fetch(`${API}/students/${currentUser.id}/profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data.clubs) {
          setJoinedClubs(data.clubs.map((club) => club.id));
        }

        if (data.registered_events) {
          setRegisteredEvents(
            data.registered_events.map((event) => event.id)
          );
        }
      })
      .catch(() => {});
  };

  const loadNotifications = () => {
    fetch(`${API}/students/1/notifications`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Notification request failed");
        }

        return res.json();
      })
      .then((data) => {
        setNotifications(data.notifications || data || []);
      })
      .catch(() => {});
  };

  const loadClubAnnouncements = async (clubId) => {
    try {
      const res = await fetch(
        `${API}/clubs/${clubId}/announcements`
      );

      if (!res.ok) {
        setClubAnnouncements([]);
        return;
      }

      const data = await res.json();
      setClubAnnouncements(data.announcements || []);
    } catch {
      setClubAnnouncements([]);
    }
  };

  const openClub = (club) => {
    setSelectedClub(club);
    setClubAnnouncements([]);
    setView("club");
    loadClubAnnouncements(club.id);
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadData();

    if (currentUser.role === "student") {
      loadStudentState();
      loadNotifications();
    }

    const interval =
      currentUser.role === "student"
        ? setInterval(
            loadNotifications,
            5000
          )
        : null;

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentUser]);

  const markNotificationRead = async (notificationId) => {
    try {
      await fetch(
        `${API}/students/1/notifications/${notificationId}/read`,
        {
          method: "POST",
        }
      );

      loadNotifications();
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    try {
      await fetch(
        `${API}/students/1/notifications/read-all`,
        {
          method: "POST",
        }
      );

      loadNotifications();
    } catch {}
  };

  const unreadNotifications = notifications.filter(
    (notification) =>
      !notification.is_read && notification.is_read !== 1
  ).length;

  const joinClub = async (clubId) => {
    if (joinedClubs.includes(clubId)) {
      setMessage("You are already a member of this club.");
      return;
    }

    try {
      const res = await fetch(`${API}/clubs/${clubId}/join`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        return;
      }

      setJoinedClubs((current) => [...current, clubId]);

      setMessage(
        data.message || "You joined the club!"
      );

      loadData();
      loadNotifications();

      setSelectedClub((current) =>
        current && current.id === clubId
          ? {
              ...current,
              members: current.members + 1,
            }
          : current
      );
    } catch {
      setMessage("Could not connect to backend");
    }
  };

  const registerEvent = async (eventId) => {
    if (registeredEvents.includes(eventId)) {
      setMessage("You are already registered for this event.");
      return;
    }

    try {
      const res = await fetch(
        `${API}/events/${eventId}/register`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        return;
      }

      setRegisteredEvents((current) => [
        ...current,
        eventId,
      ]);

      setMessage(
        data.message || "You registered for the event!"
      );

      loadData();
      loadStudentState();
      loadNotifications();

      setSelectedEvent((current) =>
        current && current.id === eventId
          ? {
              ...current,
              registered: current.registered + 1,
            }
          : current
      );
    } catch {
      setMessage("Could not connect to backend");
    }
  };

  const normalizedSearch =
    searchQuery.trim().toLowerCase();

  const filteredClubs = clubs.filter((club) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      club.name,
      club.category,
      club.description,
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );
  });

  const filteredEvents = events.filter((event) => {
    if (!normalizedSearch) {
      return true;
    }

    return [
      event.title,
      event.description,
      event.venue,
      event.date,
      event.time,
    ]
      .filter(Boolean)
      .some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );
  });

  const hasSearchResults =
    filteredClubs.length > 0 ||
    filteredEvents.length > 0;

  return (
    <div className="app" style={{ position: "relative" }}>
      <style>{`
        .campusCanvasBackground {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
          background: #f7fafc;
        }

        .campusCanvasBackground canvas {
          display: block;
          width: 100%;
          height: 100%;
          opacity: 0.95;
        }

        .campusCanvasBackground::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(to bottom, black, transparent 88%);
          -webkit-mask-image: linear-gradient(to bottom, black, transparent 88%);
        }

        .app > :not(.campusCanvasBackground) {
          position: relative;
          z-index: 1;
        }

        .heroCard {
          position: relative;
          width: 100%;
          min-height: 430px;
          height: 430px;
          overflow: hidden;
          isolation: isolate;
          border-radius: 28px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.10);
        }

        .heroCard::before {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: inherit;
          pointer-events: none;
          z-index: 5;
        }

        .heroCard::after {
          content: "";
          position: absolute;
          width: 180px;
          height: 180px;
          right: -80px;
          top: -90px;
          border: 1px solid rgba(6, 182, 212, 0.24);
          border-radius: 50%;
          animation: heroPulseRing 5s ease-in-out infinite;
          pointer-events: none;
          z-index: 2;
        }

        .heroNetwork {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          background: #ffffff;
        }

        .heroNetwork::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(15, 23, 42, 0.028) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.028) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.75;
          animation: heroGridDrift 12s linear infinite;
        }

        .heroNetworkSvg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .networkLine {
          fill: none;
          stroke: rgba(15, 23, 42, 0.13);
          stroke-width: 1;
        }

        .networkLine.active {
          stroke: rgba(6, 182, 212, 0.46);
          stroke-width: 1.5;
          stroke-dasharray: 5 8;
          animation: networkDash 8s linear infinite;
        }

        .networkRing {
          fill: none;
          stroke: rgba(6, 182, 212, 0.13);
          stroke-width: 1;
          transform-origin: 50% 50%;
          animation: networkSpin 18s linear infinite;
        }

        .networkRing.alt {
          stroke: rgba(245, 158, 11, 0.15);
          stroke-dasharray: 3 7;
          animation-direction: reverse;
          animation-duration: 13s;
        }

        .networkNode {
          fill: #ffffff;
          stroke: #0f172a;
          stroke-width: 1.5;
          filter: drop-shadow(0 5px 10px rgba(15, 23, 42, 0.12));
        }

        .networkNode.core {
          stroke: #06b6d4;
          stroke-width: 2;
        }

        .networkNode.coral {
          stroke: #f97316;
        }

        .networkNode.amber {
          stroke: #f59e0b;
        }

        .networkNode.teal {
          stroke: #14b8a6;
        }

        .networkNodePulse {
          fill: none;
          stroke: rgba(6, 182, 212, 0.42);
          stroke-width: 1;
          transform-origin: center;
          animation: nodePulse 3.4s ease-out infinite;
        }

        .networkNodePulse.orange {
          stroke: rgba(249, 115, 22, 0.34);
          animation-delay: -1.7s;
        }

        .networkPacket {
          fill: #06b6d4;
          filter: drop-shadow(0 0 5px rgba(6, 182, 212, 0.7));
        }

        .networkPacket.orange {
          fill: #f97316;
          filter: drop-shadow(0 0 5px rgba(249, 115, 22, 0.65));
        }

        .heroCore {
          position: absolute;
          left: 50%;
          top: 38%;
          width: 86px;
          height: 86px;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          border: 1px solid rgba(6, 182, 212, 0.38);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.88);
          box-shadow:
            0 20px 45px rgba(15, 23, 42, 0.10),
            0 0 0 12px rgba(6, 182, 212, 0.035);
          z-index: 3;
          animation: coreFloat 5s ease-in-out infinite;
        }

        .heroCore::before,
        .heroCore::after {
          content: "";
          position: absolute;
          inset: -13px;
          border: 1px solid rgba(6, 182, 212, 0.14);
          border-radius: 50%;
          animation: coreOrbit 11s linear infinite;
        }

        .heroCore::after {
          inset: -24px;
          border-color: rgba(245, 158, 11, 0.11);
          border-style: dashed;
          animation-direction: reverse;
          animation-duration: 17s;
        }

        .heroCoreLetter {
          font-size: 34px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1;
        }

        .heroCoreLabel {
          position: absolute;
          top: calc(100% + 26px);
          white-space: nowrap;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.46);
        }

        .heroMetricLayer {
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 18px;
          z-index: 6;
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.82);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.10);
        }

        .heroMetricLayer h3 {
          position: relative;
          margin: 0 0 12px;
          color: #0f172a;
        }

        .heroMetricLayer .journey {
          margin-bottom: 12px;
        }

        .heroMetricLayer .verified {
          border-top: 1px solid rgba(15, 23, 42, 0.08);
          padding-top: 10px;
          color: #059669;
        }

        .heroStatus {
          position: absolute;
          right: 18px;
          top: 18px;
          z-index: 7;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid rgba(6, 182, 212, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.84);
          color: #0f766e;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          backdrop-filter: blur(12px);
        }

        .heroStatusDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #14b8a6;
          box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.10);
          animation: statusBlink 2.2s ease-in-out infinite;
        }

        .heroMicroLabel {
          position: absolute;
          z-index: 4;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          color: rgba(15, 23, 42, 0.38);
          animation: labelFloat 5s ease-in-out infinite;
        }

        .heroMicroLabel.one { left: 14%; top: 25%; }
        .heroMicroLabel.two { right: 10%; top: 48%; animation-delay: -2s; }
        .heroMicroLabel.three { left: 16%; top: 53%; animation-delay: -3.5s; }

        @keyframes heroGridDrift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(28px, 28px, 0); }
        }

        @keyframes networkDash {
          to { stroke-dashoffset: -100; }
        }

        @keyframes networkSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes nodePulse {
          0% { transform: scale(0.5); opacity: 0.75; }
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes coreFloat {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-7px); }
        }

        @keyframes coreOrbit {
          to { transform: rotate(360deg); }
        }

        @keyframes heroPulseRing {
          0%, 100% { transform: scale(0.86); opacity: 0.25; }
          50% { transform: scale(1.08); opacity: 0.65; }
        }

        @keyframes statusBlink {
          0%, 100% { opacity: 0.55; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }

        @keyframes labelFloat {
          0%, 100% { transform: translateY(0); opacity: 0.34; }
          50% { transform: translateY(-5px); opacity: 0.72; }
        }

        @media (max-width: 900px) {
          .heroCore { top: 31%; }
          .heroStatus { top: 12px; right: 12px; }
          .heroMicroLabel { display: none; }
        }

        @media (max-width: 900px) {
          .heroCard {
            min-height: 380px;
            height: 380px;
          }
        }

        @media (max-width: 700px) {
          .campusCanvasBackground canvas { opacity: 0.65; }
          .campusCanvasBackground::before { opacity: 0.6; }
          .heroCard {
            min-height: 340px;
            height: 340px;
          }
          .heroCore { width: 68px; height: 68px; }
          .heroCoreLetter { font-size: 28px; }
          .heroMetricLayer { left: 12px; right: 12px; bottom: 12px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .heroNetwork *,
          .heroCard::after,
          .heroCore,
          .heroCore::before,
          .heroCore::after { animation: none !important; }
        }

        /* =====================================================
           CAMPUSLOOP ULTRA MOTION SYSTEM
           -----------------------------------------------------
           This layer is intentionally self-contained. It does
           not change API logic, routing, dashboard state, or
           event handlers. It only creates the visual system.
           ===================================================== */

        .heroCard {
          min-height: 470px;
          height: 470px;
          transform: translateZ(0);
          contain: paint;
        }

        .heroNetwork {
          min-height: 100%;
          height: 100%;
          background: #fbfdfe;
          cursor: default;
        }

        .heroNetwork::after {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.18);
          pointer-events: none;
          z-index: 1;
        }

        .heroNetworkSvg {
          z-index: 2;
        }

        .heroEnergyField {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 2;
          pointer-events: none;
        }

        .heroParticle {
          position: absolute;
          display: block;
          border-radius: 999px;
          opacity: 0.15;
          background: #06b6d4;
          box-shadow: 0 0 8px rgba(6,182,212,0.45);
          animation-name: particleDrift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }

        .heroParticle.teal { background: #06b6d4; box-shadow: 0 0 10px rgba(6,182,212,0.52); }
        .heroParticle.orange { background: #f97316; box-shadow: 0 0 10px rgba(249,115,22,0.46); }
        .heroParticle.lime { background: #84cc16; box-shadow: 0 0 10px rgba(132,204,22,0.44); }
        .heroParticle.ink { background: #0f172a; box-shadow: 0 0 8px rgba(15,23,42,0.20); }

        .energyLink {
          stroke: rgba(15,23,42,0.10);
          stroke-width: 0.65;
          vector-effect: non-scaling-stroke;
        }

        .energyLink:nth-of-type(3n) {
          stroke: rgba(6,182,212,0.23);
          stroke-dasharray: 2 7;
          animation: energyDash 4.8s linear infinite;
        }

        .energyLink:nth-of-type(4n) {
          stroke: rgba(249,115,22,0.19);
          stroke-dasharray: 3 9;
          animation: energyDashReverse 6.4s linear infinite;
        }

        .networkNodeX {
          fill: #ffffff;
          stroke: #0f172a;
          stroke-width: 0.9;
          vector-effect: non-scaling-stroke;
          filter: drop-shadow(0 4px 7px rgba(15,23,42,0.14));
          animation: nodeBreathe 3.6s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }

        .networkNodeX.teal { stroke: #06b6d4; }
        .networkNodeX.orange { stroke: #f97316; }
        .networkNodeX.lime { stroke: #84cc16; }

        .nodeEcho {
          fill: none;
          stroke: rgba(6,182,212,0.16);
          stroke-width: 0.7;
          vector-effect: non-scaling-stroke;
          transform-box: fill-box;
          transform-origin: center;
          animation: echoExpand 3.8s ease-out infinite;
        }

        .nodeEcho.n01, .nodeEcho.n05, .nodeEcho.n08, .nodeEcho.n12, .nodeEcho.n17, .nodeEcho.n23 {
          stroke: rgba(249,115,22,0.15);
          animation-delay: -1.3s;
        }

        .nodeEcho.n03, .nodeEcho.n07, .nodeEcho.n15, .nodeEcho.n20 {
          stroke: rgba(132,204,22,0.14);
          animation-delay: -2.1s;
        }

        .svgPacket {
          opacity: 0.96;
          filter: drop-shadow(0 0 6px rgba(6,182,212,0.62));
        }

        .svgPacket.teal { fill: #06b6d4; }
        .svgPacket.orange { fill: #f97316; filter: drop-shadow(0 0 6px rgba(249,115,22,0.60)); }

        .heroPulseDisc {
          position: absolute;
          left: 50%;
          top: 39%;
          width: 130px;
          height: 130px;
          transform: translate(-50%,-50%);
          border-radius: 50%;
          border: 1px solid rgba(6,182,212,0.14);
          z-index: 3;
          pointer-events: none;
          animation: discBreath 5.4s ease-in-out infinite;
        }

        .heroPulseDisc::before,
        .heroPulseDisc::after {
          content: "";
          position: absolute;
          inset: -24px;
          border-radius: 50%;
          border: 1px solid rgba(6,182,212,0.09);
          animation: discOrbit 12s linear infinite;
        }

        .heroPulseDisc::after {
          inset: -48px;
          border-color: rgba(249,115,22,0.08);
          animation-duration: 19s;
          animation-direction: reverse;
        }

        .heroCore {
          top: 39%;
          width: 96px;
          height: 96px;
          background: rgba(255,255,255,0.94);
          border: 1px solid rgba(6,182,212,0.42);
          box-shadow:
            0 22px 55px rgba(15,23,42,0.13),
            0 0 0 10px rgba(6,182,212,0.025),
            inset 0 0 24px rgba(6,182,212,0.035);
          animation: coreFloatStrong 4.8s ease-in-out infinite;
        }

        .heroCore::before {
          inset: -15px;
          border-color: rgba(6,182,212,0.22);
          animation: coreOrbit 8s linear infinite;
        }

        .heroCore::after {
          inset: -29px;
          border-color: rgba(249,115,22,0.15);
          animation-duration: 14s;
        }

        .heroCoreLetter {
          position: relative;
          z-index: 2;
          font-size: 38px;
          text-shadow: 0 5px 16px rgba(15,23,42,0.10);
          animation: letterPulse 3.8s ease-in-out infinite;
        }

        .heroCoreLabel {
          top: calc(100% + 31px);
          color: rgba(15,23,42,0.50);
          animation: labelFloatStrong 4.2s ease-in-out infinite;
        }

        .heroNetworkBadge {
          position: absolute;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 11px;
          border: 1px solid rgba(15,23,42,0.09);
          border-radius: 999px;
          background: rgba(255,255,255,0.90);
          box-shadow: 0 12px 28px rgba(15,23,42,0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0f766e;
          animation: badgeFloat 5s ease-in-out infinite;
        }

        .heroNetworkBadge.left { left: 18px; top: 18px; }
        .heroNetworkBadge.right { right: 18px; top: 64px; animation-delay: -2.2s; }

        .heroNetworkBadgeDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #14b8a6;
          box-shadow: 0 0 0 5px rgba(20,184,166,0.09);
          animation: liveDot 1.9s ease-in-out infinite;
        }

        .heroFloatingCard {
          position: absolute;
          z-index: 8;
          min-width: 118px;
          padding: 11px 13px;
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 15px;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 18px 38px rgba(15,23,42,0.10);
          backdrop-filter: blur(13px);
          -webkit-backdrop-filter: blur(13px);
          animation: floatingCard 6s ease-in-out infinite;
        }

        .heroFloatingCard.one { left: 22px; top: 41%; }
        .heroFloatingCard.two { right: 18px; top: 33%; animation-delay: -2.1s; }
        .heroFloatingCard.three { left: 29%; top: 15%; animation-delay: -4s; }

        .heroFloatingCard strong {
          display: block;
          font-size: 15px;
          line-height: 1;
          color: #0f172a;
        }

        .heroFloatingCard span {
          display: block;
          margin-top: 5px;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: rgba(15,23,42,0.45);
        }

        .heroScanBeam {
          position: absolute;
          left: -20%;
          top: 0;
          width: 22%;
          height: 100%;
          z-index: 5;
          pointer-events: none;
          background: rgba(6,182,212,0.035);
          border-left: 1px solid rgba(6,182,212,0.13);
          border-right: 1px solid rgba(6,182,212,0.08);
          transform: skewX(-14deg);
          animation: scanBeam 8.5s ease-in-out infinite;
        }

        .heroCornerTicks {
          position: absolute;
          inset: 14px;
          z-index: 6;
          pointer-events: none;
          border: 1px solid rgba(15,23,42,0.045);
          border-radius: 22px;
        }

        .heroCornerTicks::before,
        .heroCornerTicks::after {
          content: "";
          position: absolute;
          width: 42px;
          height: 42px;
          border-color: rgba(6,182,212,0.30);
          border-style: solid;
        }

        .heroCornerTicks::before {
          left: -1px;
          top: -1px;
          border-width: 2px 0 0 2px;
          border-radius: 10px 0 0 0;
        }

        .heroCornerTicks::after {
          right: -1px;
          bottom: -1px;
          border-width: 0 2px 2px 0;
          border-radius: 0 0 10px 0;
        }

        .heroDataRail {
          position: absolute;
          left: 50%;
          bottom: 112px;
          width: 72%;
          height: 1px;
          transform: translateX(-50%);
          background: rgba(15,23,42,0.07);
          z-index: 6;
          overflow: visible;
        }

        .heroDataRail::before,
        .heroDataRail::after {
          content: "";
          position: absolute;
          top: -2px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 0 5px rgba(6,182,212,0.07), 0 0 12px rgba(6,182,212,0.55);
          animation: railTravel 5s linear infinite;
        }

        .heroDataRail::after {
          background: #f97316;
          animation-delay: -2.4s;
          animation-duration: 6.7s;
        }

        .heroMetricLayer {
          background: rgba(255,255,255,0.91);
          border-color: rgba(255,255,255,0.95);
          box-shadow: 0 20px 52px rgba(15,23,42,0.13);
          animation: metricLift 6s ease-in-out infinite;
        }

        .heroMetricLayer::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 1px;
          background: rgba(6,182,212,0.30);
          transform-origin: left;
          animation: metricScan 4.8s ease-in-out infinite;
        }

        .journey > div {
          position: relative;
          overflow: hidden;
        }

        .journey > div::after {
          content: "";
          position: absolute;
          left: -120%;
          top: 0;
          width: 80%;
          height: 100%;
          background: rgba(6,182,212,0.06);
          transform: skewX(-18deg);
          animation: metricSweep 5.8s ease-in-out infinite;
        }

        .journey > div:nth-child(2)::after { animation-delay: -1.8s; }
        .journey > div:nth-child(3)::after { animation-delay: -3.6s; }

        @keyframes particleDrift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(0.65); opacity: 0.08; }
          25% { transform: translate3d(8px, -12px, 0) scale(1); opacity: 0.36; }
          50% { transform: translate3d(-6px, -22px, 0) scale(1.35); opacity: 0.70; }
          75% { transform: translate3d(-13px, -7px, 0) scale(0.9); opacity: 0.25; }
        }

        @keyframes energyDash {
          to { stroke-dashoffset: -70; }
        }

        @keyframes energyDashReverse {
          to { stroke-dashoffset: 90; }
        }

        @keyframes nodeBreathe {
          0%, 100% { transform: scale(0.90); opacity: 0.78; }
          50% { transform: scale(1.22); opacity: 1; }
        }

        @keyframes echoExpand {
          0% { transform: scale(0.55); opacity: 0.62; }
          80%, 100% { transform: scale(2.8); opacity: 0; }
        }

        @keyframes discBreath {
          0%, 100% { transform: translate(-50%,-50%) scale(0.86); opacity: 0.45; }
          50% { transform: translate(-50%,-50%) scale(1.12); opacity: 0.90; }
        }

        @keyframes discOrbit {
          to { transform: rotate(360deg); }
        }

        @keyframes coreFloatStrong {
          0%, 100% { transform: translate(-50%,-50%) translateY(0) scale(1); }
          50% { transform: translate(-50%,-50%) translateY(-9px) scale(1.035); }
        }

        @keyframes letterPulse {
          0%, 100% { transform: scale(0.94); opacity: 0.78; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        @keyframes labelFloatStrong {
          0%, 100% { transform: translateY(0); opacity: 0.42; }
          50% { transform: translateY(-6px); opacity: 0.85; }
        }

        @keyframes badgeFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes liveDot {
          0%, 100% { transform: scale(0.7); opacity: 0.55; }
          50% { transform: scale(1.15); opacity: 1; }
        }

        @keyframes floatingCard {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          30% { transform: translate3d(4px,-7px,0) rotate(0.4deg); }
          65% { transform: translate3d(-4px,-12px,0) rotate(-0.35deg); }
        }

        @keyframes scanBeam {
          0%, 15% { left: -24%; opacity: 0; }
          25% { opacity: 1; }
          75% { opacity: 0.8; }
          88%, 100% { left: 108%; opacity: 0; }
        }

        @keyframes railTravel {
          0% { left: 0%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes metricLift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes metricScan {
          0%, 100% { transform: scaleX(0.18); opacity: 0.28; }
          50% { transform: scaleX(1); opacity: 0.85; }
        }

        @keyframes metricSweep {
          0%, 35% { left: -120%; }
          70%, 100% { left: 150%; }
        }

        @media (max-width: 900px) {
          .heroCard { min-height: 410px; height: 410px; }
          .heroFloatingCard.three { display: none; }
          .heroNetworkBadge.right { top: 18px; }
        }

        @media (max-width: 700px) {
          .heroCard { min-height: 360px; height: 360px; }
          .heroFloatingCard { transform: scale(0.88); }
          .heroFloatingCard.one { left: 5px; }
          .heroFloatingCard.two { right: 5px; }
          .heroNetworkBadge { transform: scale(0.88); }
          .heroNetworkBadge.left { left: 8px; top: 8px; }
          .heroNetworkBadge.right { right: 8px; top: 8px; }
          .heroPulseDisc { top: 35%; width: 95px; height: 95px; }
          .heroCore { top: 35%; width: 72px; height: 72px; }
          .heroCoreLetter { font-size: 30px; }
          .heroDataRail { bottom: 104px; width: 82%; }
        }

        @media (prefers-reduced-motion: reduce) {
          .heroParticle,
          .networkNodeX,
          .nodeEcho,
          .energyLink,
          .heroPulseDisc,
          .heroCore,
          .heroCoreLetter,
          .heroCoreLabel,
          .heroNetworkBadge,
          .heroNetworkBadgeDot,
          .heroFloatingCard,
          .heroScanBeam,
          .heroDataRail::before,
          .heroDataRail::after,
          .heroMetricLayer,
          .heroMetricLayer::before,
          .journey > div::after {
            animation: none !important;
          }
        }
        .heroParticle.p001 {
          left: 77.36%;
          top: 43.00%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: 0.00s;
          animation-duration: 3.80s;
        }
        .heroParticle.p002 {
          left: 28.58%;
          top: 56.08%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.19s;
          animation-duration: 4.27s;
        }
        .heroParticle.p003 {
          left: 52.69%;
          top: 22.58%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.38s;
          animation-duration: 4.74s;
        }
        .heroParticle.p004 {
          left: 69.74%;
          top: 60.16%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.57s;
          animation-duration: 5.21s;
        }
        .heroParticle.p005 {
          left: 16.39%;
          top: 39.04%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.76s;
          animation-duration: 5.68s;
        }
        .heroParticle.p006 {
          left: 80.22%;
          top: 30.18%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.95s;
          animation-duration: 6.15s;
        }
        .heroParticle.p007 {
          left: 40.26%;
          top: 67.15%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.14s;
          animation-duration: 6.62s;
        }
        .heroParticle.p008 {
          left: 31.93%;
          top: 19.81%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.33s;
          animation-duration: 7.09s;
        }
        .heroParticle.p009 {
          left: 88.41%;
          top: 52.35%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.52s;
          animation-duration: 7.56s;
        }
        .heroParticle.p010 {
          left: 10.63%;
          top: 53.83%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.71s;
          animation-duration: 8.03s;
        }
        .heroParticle.p011 {
          left: 68.77%;
          top: 16.26%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.90s;
          animation-duration: 8.50s;
        }
        .heroParticle.p012 {
          left: 63.76%;
          top: 72.24%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.09s;
          animation-duration: 3.80s;
        }
        .heroParticle.p013 {
          left: 8.76%;
          top: 27.07%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.28s;
          animation-duration: 4.27s;
        }
        .heroParticle.p014 {
          left: 98.20%;
          top: 35.93%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.47s;
          animation-duration: 4.74s;
        }
        .heroParticle.p015 {
          left: 20.64%;
          top: 70.84%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.66s;
          animation-duration: 5.21s;
        }
        .heroParticle.p016 {
          left: 43.22%;
          top: 8.13%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.85s;
          animation-duration: 5.68s;
        }
        .heroParticle.p017 {
          left: 91.62%;
          top: 66.39%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.04s;
          animation-duration: 6.15s;
        }
        .heroParticle.p018 {
          left: -6.08%;
          top: 44.55%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.23s;
          animation-duration: 6.62s;
        }
        .heroParticle.p019 {
          left: 90.98%;
          top: 15.81%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.42s;
          animation-duration: 7.09s;
        }
        .heroParticle.p020 {
          left: 48.74%;
          top: 61.22%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.61s;
          animation-duration: 7.56s;
        }
        .heroParticle.p021 {
          left: 31.39%;
          top: 28.13%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.80s;
          animation-duration: 8.03s;
        }
        .heroParticle.p022 {
          left: 80.47%;
          top: 45.73%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.99s;
          animation-duration: 8.50s;
        }
        .heroParticle.p023 {
          left: 23.37%;
          top: 55.35%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.18s;
          animation-duration: 3.80s;
        }
        .heroParticle.p024 {
          left: 57.49%;
          top: 20.80%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.37s;
          animation-duration: 4.27s;
        }
        .heroParticle.p025 {
          left: 67.81%;
          top: 63.72%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.56s;
          animation-duration: 4.74s;
        }
        .heroParticle.p026 {
          left: 14.26%;
          top: 35.40%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.75s;
          animation-duration: 5.21s;
        }
        .heroParticle.p027 {
          left: 85.59%;
          top: 32.04%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.94s;
          animation-duration: 5.68s;
        }
        .heroParticle.p028 {
          left: 34.21%;
          top: 68.15%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.13s;
          animation-duration: 6.15s;
        }
        .heroParticle.p029 {
          left: 35.59%;
          top: 16.28%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.32s;
          animation-duration: 6.62s;
        }
        .heroParticle.p030 {
          left: 89.20%;
          top: 56.73%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.51s;
          animation-duration: 7.09s;
        }
        .heroParticle.p031 {
          left: 5.55%;
          top: 50.81%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.70s;
          animation-duration: 7.56s;
        }
        .heroParticle.p032 {
          left: 75.78%;
          top: 16.27%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.89s;
          animation-duration: 8.03s;
        }
        .heroParticle.p033 {
          left: 58.36%;
          top: 75.43%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -6.08s;
          animation-duration: 8.50s;
        }
        .heroParticle.p034 {
          left: 9.64%;
          top: 22.16%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -6.27s;
          animation-duration: 3.80s;
        }
        .heroParticle.p035 {
          left: 102.56%;
          top: 40.10%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -6.46s;
          animation-duration: 4.27s;
        }
        .heroParticle.p036 {
          left: 13.04%;
          top: 69.64%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -6.65s;
          animation-duration: 4.74s;
        }
        .heroParticle.p037 {
          left: 50.27%;
          top: 5.58%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -6.84s;
          animation-duration: 5.21s;
        }
        .heroParticle.p038 {
          left: 88.85%;
          top: 71.55%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: 0.00s;
          animation-duration: 5.68s;
        }
        .heroParticle.p039 {
          left: 22.76%;
          top: 41.32%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.19s;
          animation-duration: 6.15s;
        }
        .heroParticle.p040 {
          left: 73.14%;
          top: 31.29%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.38s;
          animation-duration: 6.62s;
        }
        .heroParticle.p041 {
          left: 44.50%;
          top: 63.17%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.57s;
          animation-duration: 7.09s;
        }
        .heroParticle.p042 {
          left: 32.72%;
          top: 24.70%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.76s;
          animation-duration: 7.56s;
        }
        .heroParticle.p043 {
          left: 82.91%;
          top: 49.01%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.95s;
          animation-duration: 8.03s;
        }
        .heroParticle.p044 {
          left: 18.13%;
          top: 53.90%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.14s;
          animation-duration: 8.50s;
        }
        .heroParticle.p045 {
          left: 63.04%;
          top: 19.55%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.33s;
          animation-duration: 3.80s;
        }
        .heroParticle.p046 {
          left: 64.78%;
          top: 67.21%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.52s;
          animation-duration: 4.27s;
        }
        .heroParticle.p047 {
          left: 13.04%;
          top: 31.32%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.71s;
          animation-duration: 4.74s;
        }
        .heroParticle.p048 {
          left: 90.70%;
          top: 34.63%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.90s;
          animation-duration: 5.21s;
        }
        .heroParticle.p049 {
          left: 27.61%;
          top: 68.47%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.09s;
          animation-duration: 5.68s;
        }
        .heroParticle.p050 {
          left: 40.35%;
          top: 13.04%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.28s;
          animation-duration: 6.15s;
        }
        .heroParticle.p051 {
          left: 88.86%;
          top: 61.40%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.47s;
          animation-duration: 6.62s;
        }
        .heroParticle.p052 {
          left: 1.02%;
          top: 47.07%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.66s;
          animation-duration: 7.09s;
        }
        .heroParticle.p053 {
          left: 83.09%;
          top: 17.08%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.85s;
          animation-duration: 7.56s;
        }
        .heroParticle.p054 {
          left: 51.92%;
          top: 78.14%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.04s;
          animation-duration: 8.03s;
        }
        .heroParticle.p055 {
          left: 11.79%;
          top: 17.15%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.23s;
          animation-duration: 8.50s;
        }
        .heroParticle.p056 {
          left: 106.05%;
          top: 44.91%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.42s;
          animation-duration: 3.80s;
        }
        .heroParticle.p057 {
          left: 5.43%;
          top: 67.55%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.61s;
          animation-duration: 4.27s;
        }
        .heroParticle.p058 {
          left: 53.78%;
          top: 24.93%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.80s;
          animation-duration: 4.74s;
        }
        .heroParticle.p059 {
          left: 66.48%;
          top: 58.95%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.99s;
          animation-duration: 5.21s;
        }
        .heroParticle.p060 {
          left: 20.04%;
          top: 38.40%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.18s;
          animation-duration: 5.68s;
        }
        .heroParticle.p061 {
          left: 78.22%;
          top: 32.34%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.37s;
          animation-duration: 6.15s;
        }
        .heroParticle.p062 {
          left: 39.47%;
          top: 64.64%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.56s;
          animation-duration: 6.62s;
        }
        .heroParticle.p063 {
          left: 35.14%;
          top: 21.27%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.75s;
          animation-duration: 7.09s;
        }
        .heroParticle.p064 {
          left: 84.53%;
          top: 52.77%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.94s;
          animation-duration: 7.56s;
        }
        .heroParticle.p065 {
          left: 13.05%;
          top: 51.73%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.13s;
          animation-duration: 8.03s;
        }
        .heroParticle.p066 {
          left: 69.20%;
          top: 18.93%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.32s;
          animation-duration: 8.50s;
        }
        .heroParticle.p067 {
          left: 60.65%;
          top: 70.49%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.51s;
          animation-duration: 3.80s;
        }
        .heroParticle.p068 {
          left: 12.87%;
          top: 26.91%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.70s;
          animation-duration: 4.27s;
        }
        .heroParticle.p069 {
          left: 95.35%;
          top: 37.96%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.89s;
          animation-duration: 4.74s;
        }
        .heroParticle.p070 {
          left: 20.63%;
          top: 68.03%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -6.08s;
          animation-duration: 5.21s;
        }
        .heroParticle.p071 {
          left: 46.16%;
          top: 10.20%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -6.27s;
          animation-duration: 5.68s;
        }
        .heroParticle.p072 {
          left: 87.30%;
          top: 66.23%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -6.46s;
          animation-duration: 6.15s;
        }
        .heroParticle.p073 {
          left: -2.74%;
          top: 42.66%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -6.65s;
          animation-duration: 6.62s;
        }
        .heroParticle.p074 {
          left: 90.49%;
          top: 18.75%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -6.84s;
          animation-duration: 7.09s;
        }
        .heroParticle.p075 {
          left: 44.55%;
          top: 80.24%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: 0.00s;
          animation-duration: 7.56s;
        }
        .heroParticle.p076 {
          left: 15.27%;
          top: 12.18%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.19s;
          animation-duration: 8.03s;
        }
        .heroParticle.p077 {
          left: 76.89%;
          top: 46.35%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.38s;
          animation-duration: 8.50s;
        }
        .heroParticle.p078 {
          left: 25.34%;
          top: 53.24%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.57s;
          animation-duration: 3.80s;
        }
        .heroParticle.p079 {
          left: 58.27%;
          top: 23.26%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.76s;
          animation-duration: 4.27s;
        }
        .heroParticle.p080 {
          left: 64.67%;
          top: 62.29%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.95s;
          animation-duration: 4.74s;
        }
        .heroParticle.p081 {
          left: 18.06%;
          top: 34.99%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.14s;
          animation-duration: 5.21s;
        }
        .heroParticle.p082 {
          left: 83.24%;
          top: 34.10%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.33s;
          animation-duration: 5.68s;
        }
        .heroParticle.p083 {
          left: 33.77%;
          top: 65.55%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.52s;
          animation-duration: 6.15s;
        }
        .heroParticle.p084 {
          left: 38.63%;
          top: 17.99%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.71s;
          animation-duration: 6.62s;
        }
        .heroParticle.p085 {
          left: 85.18%;
          top: 56.90%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.90s;
          animation-duration: 7.09s;
        }
        .heroParticle.p086 {
          left: 8.32%;
          top: 48.83%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.09s;
          animation-duration: 7.56s;
        }
        .heroParticle.p087 {
          left: 75.82%;
          top: 19.02%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.28s;
          animation-duration: 8.03s;
        }
        .heroParticle.p088 {
          left: 55.46%;
          top: 73.43%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.47s;
          animation-duration: 8.50s;
        }
        .heroParticle.p089 {
          left: 13.86%;
          top: 22.29%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.66s;
          animation-duration: 3.80s;
        }
        .heroParticle.p090 {
          left: 99.33%;
          top: 41.96%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.85s;
          animation-duration: 4.27s;
        }
        .heroParticle.p091 {
          left: 13.47%;
          top: 66.77%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.04s;
          animation-duration: 4.74s;
        }
        .heroParticle.p092 {
          left: 52.95%;
          top: 7.90%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.23s;
          animation-duration: 5.21s;
        }
        .heroParticle.p093 {
          left: 84.47%;
          top: 71.09%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.42s;
          animation-duration: 5.68s;
        }
        .heroParticle.p094 {
          left: -5.55%;
          top: 37.65%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.61s;
          animation-duration: 6.15s;
        }
        .heroParticle.p095 {
          left: 97.78%;
          top: 21.30%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.80s;
          animation-duration: 6.62s;
        }
        .heroParticle.p096 {
          left: 43.73%;
          top: 60.76%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.99s;
          animation-duration: 7.09s;
        }
        .heroParticle.p097 {
          left: 35.80%;
          top: 26.10%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.18s;
          animation-duration: 7.56s;
        }
        .heroParticle.p098 {
          left: 79.20%;
          top: 49.42%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.37s;
          animation-duration: 8.03s;
        }
        .heroParticle.p099 {
          left: 20.42%;
          top: 51.88%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.56s;
          animation-duration: 8.50s;
        }
        .heroParticle.p100 {
          left: 63.48%;
          top: 22.10%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.75s;
          animation-duration: 3.80s;
        }
        .heroParticle.p101 {
          left: 61.79%;
          top: 65.55%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.94s;
          animation-duration: 4.27s;
        }
        .heroParticle.p102 {
          left: 16.97%;
          top: 31.15%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.13s;
          animation-duration: 4.74s;
        }
        .heroParticle.p103 {
          left: 88.00%;
          top: 36.59%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.32s;
          animation-duration: 5.21s;
        }
        .heroParticle.p104 {
          left: 27.55%;
          top: 65.79%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.51s;
          animation-duration: 5.68s;
        }
        .heroParticle.p105 {
          left: 43.20%;
          top: 14.97%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.70s;
          animation-duration: 6.15s;
        }
        .heroParticle.p106 {
          left: 84.74%;
          top: 61.30%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.89s;
          animation-duration: 6.62s;
        }
        .heroParticle.p107 {
          left: 4.15%;
          top: 45.23%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -6.08s;
          animation-duration: 7.09s;
        }
        .heroParticle.p108 {
          left: 82.71%;
          top: 19.89%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -6.27s;
          animation-duration: 7.56s;
        }
        .heroParticle.p109 {
          left: 49.28%;
          top: 75.90%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -6.46s;
          animation-duration: 8.03s;
        }
        .heroParticle.p110 {
          left: 16.07%;
          top: 17.57%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -6.65s;
          animation-duration: 8.50s;
        }
        .heroParticle.p111 {
          left: 102.46%;
          top: 46.59%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -6.84s;
          animation-duration: 3.80s;
        }
        .heroParticle.p112 {
          left: 6.32%;
          top: 64.66%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: 0.00s;
          animation-duration: 4.27s;
        }
        .heroParticle.p113 {
          left: 60.58%;
          top: 6.26%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.19s;
          animation-duration: 4.74s;
        }
        .heroParticle.p114 {
          left: 80.31%;
          top: 75.82%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.38s;
          animation-duration: 5.21s;
        }
        .heroParticle.p115 {
          left: 23.68%;
          top: 38.01%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.57s;
          animation-duration: 5.68s;
        }
        .heroParticle.p116 {
          left: 75.98%;
          top: 34.33%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.76s;
          animation-duration: 6.15s;
        }
        .heroParticle.p117 {
          left: 39.03%;
          top: 62.15%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.95s;
          animation-duration: 6.62s;
        }
        .heroParticle.p118 {
          left: 38.06%;
          top: 22.89%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.14s;
          animation-duration: 7.09s;
        }
        .heroParticle.p119 {
          left: 80.70%;
          top: 52.94%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.33s;
          animation-duration: 7.56s;
        }
        .heroParticle.p120 {
          left: 15.67%;
          top: 49.81%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.52s;
          animation-duration: 8.03s;
        }
        .heroParticle.p121 {
          left: 69.28%;
          top: 21.55%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.71s;
          animation-duration: 8.50s;
        }
        .heroParticle.p122 {
          left: 57.86%;
          top: 68.61%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.90s;
          animation-duration: 3.80s;
        }
        .heroParticle.p123 {
          left: 16.89%;
          top: 26.99%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.09s;
          animation-duration: 4.27s;
        }
        .heroParticle.p124 {
          left: 92.31%;
          top: 39.76%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.28s;
          animation-duration: 4.74s;
        }
        .heroParticle.p125 {
          left: 20.97%;
          top: 65.29%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.47s;
          animation-duration: 5.21s;
        }
        .heroParticle.p126 {
          left: 48.77%;
          top: 12.36%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.66s;
          animation-duration: 5.68s;
        }
        .heroParticle.p127 {
          left: 83.12%;
          top: 65.85%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.85s;
          animation-duration: 6.15s;
        }
        .heroParticle.p128 {
          left: 0.74%;
          top: 41.00%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.04s;
          animation-duration: 6.62s;
        }
        .heroParticle.p129 {
          left: 89.67%;
          top: 21.58%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.23s;
          animation-duration: 7.09s;
        }
        .heroParticle.p130 {
          left: 42.20%;
          top: 77.77%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.42s;
          animation-duration: 7.56s;
        }
        .heroParticle.p131 {
          left: 19.57%;
          top: 12.91%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.61s;
          animation-duration: 8.03s;
        }
        .heroParticle.p132 {
          left: 104.57%;
          top: 51.75%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.80s;
          animation-duration: 8.50s;
        }
        .heroParticle.p133 {
          left: -0.58%;
          top: 61.67%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.99s;
          animation-duration: 3.80s;
        }
        .heroParticle.p134 {
          left: 58.70%;
          top: 25.71%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.18s;
          animation-duration: 4.27s;
        }
        .heroParticle.p135 {
          left: 61.80%;
          top: 60.70%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.37s;
          animation-duration: 4.74s;
        }
        .heroParticle.p136 {
          left: 21.82%;
          top: 34.81%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.56s;
          animation-duration: 5.21s;
        }
        .heroParticle.p137 {
          left: 80.68%;
          top: 35.98%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.75s;
          animation-duration: 5.68s;
        }
        .heroParticle.p138 {
          left: 33.68%;
          top: 62.98%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.94s;
          animation-duration: 6.15s;
        }
        .heroParticle.p139 {
          left: 41.38%;
          top: 19.82%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.13s;
          animation-duration: 6.62s;
        }
        .heroParticle.p140 {
          left: 81.25%;
          top: 56.83%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.32s;
          animation-duration: 7.09s;
        }
        .heroParticle.p141 {
          left: 11.27%;
          top: 47.05%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.51s;
          animation-duration: 7.56s;
        }
        .heroParticle.p142 {
          left: 75.51%;
          top: 21.69%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.70s;
          animation-duration: 8.03s;
        }
        .heroParticle.p143 {
          left: 52.89%;
          top: 71.33%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.89s;
          animation-duration: 8.50s;
        }
        .heroParticle.p144 {
          left: 17.94%;
          top: 22.64%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -6.08s;
          animation-duration: 3.80s;
        }
        .heroParticle.p145 {
          left: 95.96%;
          top: 43.60%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -6.27s;
          animation-duration: 4.27s;
        }
        .heroParticle.p146 {
          left: 14.23%;
          top: 64.00%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -6.46s;
          animation-duration: 4.74s;
        }
        .heroParticle.p147 {
          left: 55.27%;
          top: 10.28%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -6.65s;
          animation-duration: 5.21s;
        }
        .heroParticle.p148 {
          left: 80.26%;
          top: 70.41%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -6.84s;
          animation-duration: 5.68s;
        }
        .heroParticle.p149 {
          left: -1.74%;
          top: 36.20%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: 0.00s;
          animation-duration: 6.15s;
        }
        .heroParticle.p150 {
          left: 96.49%;
          top: 24.12%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.19s;
          animation-duration: 6.62s;
        }
        .heroParticle.p151 {
          left: 34.38%;
          top: 78.94%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -0.38s;
          animation-duration: 7.09s;
        }
        .heroParticle.p152 {
          left: 24.36%;
          top: 8.45%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -0.57s;
          animation-duration: 7.56s;
        }
        .heroParticle.p153 {
          left: 75.51%;
          top: 49.59%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -0.76s;
          animation-duration: 8.03s;
        }
        .heroParticle.p154 {
          left: 22.93%;
          top: 50.04%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -0.95s;
          animation-duration: 8.50s;
        }
        .heroParticle.p155 {
          left: 63.57%;
          top: 24.61%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.14s;
          animation-duration: 3.80s;
        }
        .heroParticle.p156 {
          left: 59.10%;
          top: 63.76%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -1.33s;
          animation-duration: 4.27s;
        }
        .heroParticle.p157 {
          left: 20.81%;
          top: 31.21%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -1.52s;
          animation-duration: 4.74s;
        }
        .heroParticle.p158 {
          left: 85.13%;
          top: 38.33%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -1.71s;
          animation-duration: 5.21s;
        }
        .heroParticle.p159 {
          left: 27.83%;
          top: 63.17%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -1.90s;
          animation-duration: 5.68s;
        }
        .heroParticle.p160 {
          left: 45.72%;
          top: 17.02%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.09s;
          animation-duration: 6.15s;
        }
        .heroParticle.p161 {
          left: 80.75%;
          top: 60.97%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -2.28s;
          animation-duration: 6.62s;
        }
        .heroParticle.p162 {
          left: 7.42%;
          top: 43.62%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -2.47s;
          animation-duration: 7.09s;
        }
        .heroParticle.p163 {
          left: 81.99%;
          top: 22.59%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -2.66s;
          animation-duration: 7.56s;
        }
        .heroParticle.p164 {
          left: 46.98%;
          top: 73.58%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -2.85s;
          animation-duration: 8.03s;
        }
        .heroParticle.p165 {
          left: 20.18%;
          top: 18.21%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.04s;
          animation-duration: 8.50s;
        }
        .heroParticle.p166 {
          left: 98.78%;
          top: 48.02%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.23s;
          animation-duration: 3.80s;
        }
        .heroParticle.p167 {
          left: 7.54%;
          top: 61.89%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -3.42s;
          animation-duration: 4.27s;
        }
        .heroParticle.p168 {
          left: 62.58%;
          top: 8.85%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -3.61s;
          animation-duration: 4.74s;
        }
        .heroParticle.p169 {
          left: 76.14%;
          top: 74.83%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -3.80s;
          animation-duration: 5.21s;
        }
        .heroParticle.p170 {
          left: -3.13%;
          top: 30.93%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -3.99s;
          animation-duration: 5.68s;
        }
        .heroParticle.p171 {
          left: 102.95%;
          top: 27.52%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.18s;
          animation-duration: 6.15s;
        }
        .heroParticle.p172 {
          left: 38.95%;
          top: 59.69%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -4.37s;
          animation-duration: 6.62s;
        }
        .heroParticle.p173 {
          left: 40.70%;
          top: 24.65%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -4.56s;
          animation-duration: 7.09s;
        }
        .heroParticle.p174 {
          left: 76.93%;
          top: 52.89%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -4.75s;
          animation-duration: 7.56s;
        }
        .heroParticle.p175 {
          left: 18.48%;
          top: 48.10%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -4.94s;
          animation-duration: 8.03s;
        }
        .heroParticle.p176 {
          left: 69.01%;
          top: 24.11%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.13s;
          animation-duration: 8.50s;
        }
        .heroParticle.p177 {
          left: 55.38%;
          top: 66.61%;
          width: 2.00px;
          height: 2.00px;
          animation-delay: -5.32s;
          animation-duration: 3.80s;
        }
        .heroParticle.p178 {
          left: 20.80%;
          top: 27.30%;
          width: 2.65px;
          height: 2.65px;
          animation-delay: -5.51s;
          animation-duration: 4.27s;
        }
        .heroParticle.p179 {
          left: 89.13%;
          top: 41.35%;
          width: 3.30px;
          height: 3.30px;
          animation-delay: -5.70s;
          animation-duration: 4.74s;
        }
        .heroParticle.p180 {
          left: 21.65%;
          top: 62.65%;
          width: 3.95px;
          height: 3.95px;
          animation-delay: -5.89s;
          animation-duration: 5.21s;
        }

      `}</style>

      <CampusBackground />

      <header className="navbar">
        <div
          className="logo"
          onClick={() => {
            setView("home");
            setMessage("");
            setSearchQuery("");
          }}
        >
          <div className="logoIcon">C</div>
          <span>CampusLoop</span>
        </div>

        <nav>
          <button
            className={
              view === "home" ? "activeNav" : ""
            }
            onClick={() => setView("home")}
          >
            Discover
          </button>

          <button
            className={
              view === "events" ? "activeNav" : ""
            }
            onClick={() => setView("events")}
          >
            Events
          </button>

          <button
            className={
              view === "profile" ? "activeNav" : ""
            }
            onClick={() => setView("profile")}
          >
            My Campus
          </button>

          <button
            className={
              view === "admin" ? "activeNav" : ""
            }
            onClick={() => {
              setView("admin");
            }}
          >
            <LayoutDashboard size={15} />
            Club Admin
          </button>
        </nav>

        <div className="navbarRight">
          <div
            className="notificationWrapper"
            style={{ position: "relative" }}
          >
            <button
              className="notificationButton"
              onClick={() =>
                setShowNotifications(
                  (current) => !current
                )
              }
              title="Notifications"
            >
              <Bell size={20} />

              {unreadNotifications > 0 && (
                <span className="notificationBadge">
                  {unreadNotifications > 9
                    ? "9+"
                    : unreadNotifications}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notificationPanel">
                <div className="notificationHeader">
                  <div>
                    <strong>Notifications</strong>

                    <span>
                      {unreadNotifications > 0
                        ? `${unreadNotifications} unread`
                        : "All caught up"}
                    </span>
                  </div>

                  {unreadNotifications > 0 && (
                    <button
                      className="notificationMarkAll"
                      onClick={markAllNotificationsRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notificationList">
                  {notifications.length === 0 ? (
                    <div className="notificationEmpty">
                      <Bell size={28} />

                      <strong>
                        No notifications
                      </strong>

                      <span>
                        Your CampusLoop activity will
                        appear here.
                      </span>
                    </div>
                  ) : (
                    notifications.map(
                      (notification) => {
                        const isUnread =
                          !notification.is_read &&
                          notification.is_read !== 1;

                        const notificationType =
                          notification.type ||
                          notification.notification_type ||
                          "general";

                        return (
                          <button
                            key={notification.id}
                            className={
                              isUnread
                                ? "notificationItem unread"
                                : "notificationItem"
                            }
                            onClick={() =>
                              markNotificationRead(
                                notification.id
                              )
                            }
                          >
                            <div className="notificationIcon">
                              {notificationType ===
                              "attendance" ? (
                                <ShieldCheck size={18} />
                              ) : notificationType ===
                                "announcement" ? (
                                <Megaphone size={18} />
                              ) : notificationType ===
                                "club" ? (
                                <Users size={18} />
                              ) : (
                                <CalendarDays size={18} />
                              )}
                            </div>

                            <div className="notificationContent">
                              <strong>
                                {notification.title}
                              </strong>

                              <span>
                                {notification.message}
                              </span>
                            </div>

                            {isUnread && (
                              <div className="notificationDot" />
                            )}
                          </button>
                        );
                      }
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user">
            <div className="avatar">R</div>
            <span>
                      {currentUser.name}
                    </span>

                    <button
                      className="iconButton"
                      title="Log out"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                    </button>
          </div>
        </div>
      </header>

      {message && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* =====================================================
          HOME
          ===================================================== */}

      {view === "home" && (
        <main>
          <section className="hero">
            <div>
              <div className="eyebrow">
                <Sparkles size={16} />
                YOUR CAMPUS. YOUR COMMUNITY.
              </div>

              <h1>
                Discover.
                <br />
                Participate.
                <br />
                <span>Belong.</span>
              </h1>

              <p>
                Find clubs, events and communities that
                match your interests and build a verified
                record of your campus journey.
              </p>

              <div className="searchBox">
                <Search size={20} />

                <input
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search clubs, events, communities..."
                />

                {searchQuery && (
                  <button
                    className="iconButton"
                    onClick={() =>
                      setSearchQuery("")
                    }
                    title="Clear search"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </div>

            <div className="heroCard">
              <HeroNetwork />

              <div className="heroStatus">
                <span className="heroStatusDot" />
                Live campus network
              </div>

              <div className="heroMicroLabel one">Clubs</div>
              <div className="heroMicroLabel two">Events</div>
              <div className="heroMicroLabel three">Verified</div>

              <div className="heroMetricLayer">
                <h3>Your campus journey</h3>

                <div className="journey">
                  <div>
                    <strong>3</strong>
                    <span>Clubs</span>
                  </div>

                  <div>
                    <strong>7</strong>
                    <span>Events</span>
                  </div>

                  <div>
                    <strong>4</strong>
                    <span>Verified</span>
                  </div>
                </div>

                <div className="verified">
                  <CheckCircle2 size={18} />
                  Verified participation
                </div>
              </div>
            </div>
          </section>

          {searchQuery && (
            <section className="section">
              <div className="sectionHeader">
                <div>
                  <div className="eyebrow">
                    SEARCH RESULTS
                  </div>

                  <h2>
                    Results for "{searchQuery}"
                  </h2>

                  <p>
                    {filteredClubs.length} club
                    {filteredClubs.length !== 1
                      ? "s"
                      : ""}{" "}
                    · {filteredEvents.length} event
                    {filteredEvents.length !== 1
                      ? "s"
                      : ""}
                  </p>
                </div>
              </div>
            </section>
          )}

          {!hasSearchResults && searchQuery && (
            <section className="section">
              <div className="emptyState">
                <Search size={32} />

                <h3>No results found</h3>

                <p>
                  Try searching for AI, coding,
                  robotics, hackathon or workshop.
                </p>
              </div>
            </section>
          )}

          {filteredClubs.length > 0 && (
            <section className="section">
              <div className="sectionHeader">
                <div>
                  <div className="eyebrow">
                    {searchQuery
                      ? "MATCHING CLUBS"
                      : "EXPLORE"}
                  </div>

                  <h2>
                    {searchQuery
                      ? "Communities"
                      : "Find your community"}
                  </h2>
                </div>
              </div>

              <div className="clubGrid">
                {filteredClubs.map((club) => (
                  <div
                    className="clubCard"
                    key={club.id}
                  >
                    <div className="clubImage">
                      {club.name === "AI Nexus"
                        ? "🤖"
                        : club.name === "Coding Club"
                        ? "💻"
                        : "⚙️"}
                    </div>

                    <div className="clubContent">
                      <span className="category">
                        {club.category}
                      </span>

                      <h3>{club.name}</h3>

                      <p>{club.description}</p>

                      <div className="clubBottom">
                        <div className="members">
                          <Users size={16} />
                          {club.members} members
                        </div>

                        <button
                          className="iconButton"
                          onClick={() =>
                            openClub(club)
                          }
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!searchQuery && (
            <Recommendations
              clubs={clubs}
              events={events}
              joinedClubs={joinedClubs}
              registeredEvents={registeredEvents}
              onOpenClub={openClub}
              onOpenEvent={(event) => {
                setSelectedEvent(event);
                setView("event");
              }}
            />
          )}

          {filteredEvents.length > 0 && (
            <section className="section eventsSection">
              <div className="sectionHeader">
                <div>
                  <div className="eyebrow">
                    {searchQuery
                      ? "MATCHING EVENTS"
                      : "UPCOMING"}
                  </div>

                  <h2>
                    {searchQuery
                      ? "Campus events"
                      : "Events happening on campus"}
                  </h2>
                </div>

                {!searchQuery && (
                  <button
                    className="textButton"
                    onClick={() =>
                      setView("events")
                    }
                  >
                    View all
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>

              <div className="eventList">
                {filteredEvents.map((event) => (
                  <div
                    className="eventCard"
                    key={event.id}
                  >
                    <div className="eventDate">
                      <CalendarDays size={22} />

                      <strong>
                        {event.date?.split(" ")[0]}
                      </strong>

                      <span>
                        {event.date?.split(" ")[1]}
                      </span>
                    </div>

                    <div className="eventInfo">
                      <span className="category">
                        CAMPUS EVENT
                      </span>

                      <h3>{event.title}</h3>

                      <p>{event.description}</p>

                      <div className="eventMeta">
                        <span>
                          <MapPin size={15} />
                          {event.venue}
                        </span>

                        <span>
                          <Clock size={15} />
                          {event.time}
                        </span>
                      </div>
                    </div>

                    <button
                      className="primaryButton"
                      onClick={() => {
                        setSelectedEvent(event);
                        setView("event");
                      }}
                    >
                      View Event
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      )}

      {/* =====================================================
          CLUB DETAIL
          ===================================================== */}

      {view === "club" && selectedClub && (
        <main className="detailPage">
          <button
            className="backButton"
            onClick={() => setView("home")}
          >
            ← Back to Discover
          </button>

          <section className="clubHero">
            <div className="bigClubIcon">
              {selectedClub.name === "AI Nexus"
                ? "🤖"
                : selectedClub.name === "Coding Club"
                ? "💻"
                : "⚙️"}
            </div>

            <div>
              <span className="category">
                {selectedClub.category}
              </span>

              <h1>{selectedClub.name}</h1>

              <p>{selectedClub.description}</p>

              <div className="detailStats">
                <span>
                  <Users size={17} />
                  {selectedClub.members} members
                </span>

                <span>
                  <CalendarDays size={17} />
                  Active community
                </span>
              </div>
            </div>

            <button
              className={
                joinedClubs.includes(
                  selectedClub.id
                )
                  ? "secondaryButton large"
                  : "primaryButton large"
              }
              onClick={() =>
                joinClub(selectedClub.id)
              }
              disabled={joinedClubs.includes(
                selectedClub.id
              )}
            >
              {joinedClubs.includes(
                selectedClub.id
              ) ? (
                <>
                  <CheckCircle2 size={18} />
                  Joined
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Join Club
                </>
              )}
            </button>
          </section>

          <section className="clubDetails">
            <div className="detailPanel">
              <div className="eyebrow">
                ABOUT THE COMMUNITY
              </div>

              <h2>What happens here?</h2>

              <p>
                AI Nexus brings together students
                interested in AI, machine learning,
                generative AI and emerging technologies.
              </p>

              <div className="activityTags">
                <span>AI Research</span>
                <span>Hackathons</span>
                <span>Workshops</span>
                <span>GenAI</span>
                <span>Projects</span>
              </div>
            </div>

            <div className="detailPanel">
              <div className="panelHeading">
                <div>
                  <div className="eyebrow">
                    ANNOUNCEMENTS
                  </div>

                  <h2>Latest updates</h2>
                </div>

                <Megaphone size={22} />
              </div>

              {clubAnnouncements.length === 0 ? (
                <div className="emptyState">
                  <Megaphone size={30} />

                  <p>
                    No announcements from this club
                    yet.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {clubAnnouncements.map(
                    (announcement) => (
                      <div
                        key={announcement.id}
                        style={{
                          padding: "16px",
                          borderRadius: "14px",
                          border:
                            "1px solid #e5e7eb",
                          background: "#fafafa",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            alignItems:
                              "flex-start",
                          }}
                        >
                          <div
                            style={{
                              minWidth: "34px",
                              width: "34px",
                              height: "34px",
                              borderRadius: "10px",
                              display: "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              background:
                                "#eef2ff",
                            }}
                          >
                            <Megaphone size={17} />
                          </div>

                          <div>
                            <strong
                              style={{
                                display: "block",
                                marginBottom:
                                  "5px",
                              }}
                            >
                              {announcement.title}
                            </strong>

                            <p
                              style={{
                                margin: 0,
                                lineHeight: 1.55,
                              }}
                            >
                              {announcement.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="detailPanel">
            <div className="panelHeading">
              <div>
                <div className="eyebrow">
                  UPCOMING EVENTS
                </div>

                <h2>
                  Events from this community
                </h2>
              </div>

              <CalendarDays size={22} />
            </div>

            {events.filter(
              (e) =>
                e.club_id === selectedClub.id
            ).length === 0 ? (
              <div className="emptyState">
                <CalendarDays size={30} />
                <p>No upcoming events.</p>
              </div>
            ) : (
              events
                .filter(
                  (e) =>
                    e.club_id ===
                    selectedClub.id
                )
                .map((event) => (
                  <div
                    className="miniEvent"
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setView("event");
                    }}
                  >
                    <div>
                      <strong>
                        {event.title}
                      </strong>

                      <span>
                        {event.date} ·{" "}
                        {event.venue}
                      </span>
                    </div>

                    <ArrowRight size={18} />
                  </div>
                ))
            )}
          </section>
        </main>
      )}

      {/* =====================================================
          EVENT DETAIL
          ===================================================== */}

      {view === "event" && selectedEvent && (
        <main className="detailPage">
          <button
            className="backButton"
            onClick={() => setView("events")}
          >
            ← Back to Events
          </button>

          <section className="eventDetail">
            <div className="eventDetailTop">
              <span className="category">
                CAMPUS EVENT
              </span>

              <h1>{selectedEvent.title}</h1>

              <p>
                {selectedEvent.description}
              </p>
            </div>

            <div className="eventInfoGrid">
              <div>
                <CalendarDays />
                <span>Date</span>
                <strong>
                  {selectedEvent.date}
                </strong>
              </div>

              <div>
                <Clock />
                <span>Time</span>
                <strong>
                  {selectedEvent.time}
                </strong>
              </div>

              <div>
                <MapPin />
                <span>Venue</span>
                <strong>
                  {selectedEvent.venue}
                </strong>
              </div>

              <div>
                <Users />
                <span>Registered</span>
                <strong>
                  {selectedEvent.registered}/
                  {selectedEvent.capacity}
                </strong>
              </div>
            </div>

            <div className="eventActions">
              <button
                className={
                  registeredEvents.includes(
                    selectedEvent.id
                  )
                    ? "secondaryButton large"
                    : "primaryButton large"
                }
                onClick={() =>
                  registerEvent(
                    selectedEvent.id
                  )
                }
                disabled={registeredEvents.includes(
                  selectedEvent.id
                )}
              >
                {registeredEvents.includes(
                  selectedEvent.id
                ) ? (
                  <>
                    <CheckCircle2 size={18} />
                    Registered
                  </>
                ) : (
                  <>
                    <CalendarDays size={18} />
                    Register for Event
                  </>
                )}
              </button>

              <button
                className="secondaryButton large"
                onClick={() =>
                  setAttendanceEvent(
                    selectedEvent
                  )
                }
              >
                <CheckCircle2 size={18} />
                Verify Attendance
              </button>
            </div>
          </section>
        </main>
      )}

      {/* =====================================================
          EVENTS
          ===================================================== */}

      {view === "events" && (
        <main className="detailPage">
          <div className="pageHeading">
            <div className="eyebrow">
              CAMPUS CALENDAR
            </div>

            <h1>Upcoming Events</h1>

            <p>
              Discover workshops, hackathons and
              activities happening across campus.
            </p>
          </div>

          <div className="eventList">
            {events.map((event) => (
              <div
                className="eventCard"
                key={event.id}
              >
                <div className="eventDate">
                  <CalendarDays size={22} />

                  <strong>
                    {event.date?.split(" ")[0]}
                  </strong>

                  <span>
                    {event.date?.split(" ")[1]}
                  </span>
                </div>

                <div className="eventInfo">
                  <span className="category">
                    CAMPUS EVENT
                  </span>

                  <h3>{event.title}</h3>

                  <p>{event.description}</p>

                  <div className="eventMeta">
                    <span>
                      <MapPin size={15} />
                      {event.venue}
                    </span>

                    <span>
                      <Clock size={15} />
                      {event.time}
                    </span>
                  </div>
                </div>

                <button
                  className="primaryButton"
                  onClick={() => {
                    setSelectedEvent(event);
                    setView("event");
                  }}
                >
                  View Event
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {view === "profile" && <Profile userId={currentUser.id} />}

      {view === "admin" && <AdminDashboard />}

      {attendanceEvent && (
        <AttendanceModal
          event={attendanceEvent}
          onClose={() =>
            setAttendanceEvent(null)
          }
          onSuccess={() => {
            setAttendanceEvent(null);
            setMessage(
              "Attendance verified successfully!"
            );
            loadNotifications();
            loadStudentState();
          }}
        />
      )}
    </div>
  );
}

/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

function LoginScreen({
  onLogin,
}) {
  const [loading, setLoading] =
    useState("");

  const login = async (role) => {
    setLoading(role);

    try {
      await onLogin(role);
    } finally {
      setLoading("");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(135deg, #f8fafc, #eef2ff)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "900px",
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1.05fr) minmax(320px, .95fr)",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        <div
          className="detailPanel"
          style={{
            margin: 0,
            padding: "42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div className="eyebrow">
            CAMPUS PARTICIPATION PLATFORM
          </div>

          <h1
            style={{
              fontSize: "clamp(42px, 6vw, 68px)",
              margin: "10px 0",
              lineHeight: 1,
            }}
          >
            CampusLoop
          </h1>

          <p
            style={{
              fontSize: "18px",
              lineHeight: 1.7,
              color: "#64748b",
              maxWidth: "520px",
            }}
          >
            Discover communities, participate
            in events and build your verified
            campus journey.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginTop: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <CheckCircle2 size={18} />
              Discover campus communities
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <CheckCircle2 size={18} />
              Register and participate in events
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <ShieldCheck size={18} />
              Maintain verified participation
            </div>
          </div>
        </div>

        <div
          className="detailPanel"
          style={{
            margin: 0,
            padding: "32px",
          }}
        >
          <div className="eyebrow">
            DEMO ACCESS
          </div>

          <h2
            style={{
              margin: "8px 0",
            }}
          >
            Enter CampusLoop
          </h2>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: "24px",
            }}
          >
            Choose the experience you want
            to demonstrate.
          </p>

          <button
            className="primaryButton"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px",
              marginBottom: "12px",
            }}
            disabled={!!loading}
            onClick={() =>
              login("student")
            }
          >
            <Users size={18} />

            {loading === "student"
              ? "Opening Student Portal..."
              : "Continue as Student"}
          </button>

          <button
            className="secondaryButton"
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "14px",
            }}
            disabled={!!loading}
            onClick={() =>
              login("club_admin")
            }
          >
            <LayoutDashboard size={18} />

            {loading === "club_admin"
              ? "Opening Club Admin..."
              : "Continue as Club Admin"}
          </button>

          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              borderRadius: "12px",
              background: "#f8fafc",
              fontSize: "12px",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Demo mode: authentication is
            intentionally simplified for the
            hackathon prototype.
          </div>
        </div>
      </div>
    </main>
  );
}


function Recommendations({
  clubs,
  events,
  joinedClubs,
  registeredEvents,
  onOpenClub,
  onOpenEvent,
}) {
  const joinedClubObjects = clubs.filter((club) =>
    joinedClubs.includes(club.id)
  );

  const joinedCategories = [
    ...new Set(
      joinedClubObjects
        .map((club) => club.category)
        .filter(Boolean)
    ),
  ];

  const recommendedClubs = clubs
    .filter(
      (club) =>
        !joinedClubs.includes(club.id) &&
        joinedCategories.includes(
          club.category
        )
    )
    .slice(0, 3);

  const matchingEvents = events.filter((event) => {
    if (registeredEvents.includes(event.id)) {
      return false;
    }

    const eventClub = clubs.find(
      (club) => club.id === event.club_id
    );

    return (
      eventClub &&
      joinedCategories.includes(
        eventClub.category
      )
    );
  });

  const fallbackEvents = events.filter(
    (event) =>
      !registeredEvents.includes(event.id)
  );

  const recommendedEvents = [
    ...matchingEvents,
    ...fallbackEvents.filter(
      (event) =>
        !matchingEvents.some(
          (matchingEvent) =>
            matchingEvent.id === event.id
        )
    ),
  ].slice(0, 3);

  const recommendations = [
    ...recommendedClubs.map((club) => ({
      type: "club",
      id: `club-${club.id}`,
      data: club,
      reason: `Because you're interested in ${club.category}`,
    })),

    ...recommendedEvents.map((event) => ({
      type: "event",
      id: `event-${event.id}`,
      data: event,
      reason: "Matches your campus interests",
    })),
  ].slice(0, 4);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="section">
      <div className="sectionHeader">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} />
            RECOMMENDED FOR YOU
          </div>

          <h2>Picked for your interests</h2>

          <p>
            Based on the clubs and activities you're
            already part of.
          </p>
        </div>
      </div>

      <div className="clubGrid">
        {recommendations.map((item) => {
          if (item.type === "club") {
            const club = item.data;

            return (
              <div
                className="clubCard"
                key={item.id}
              >
                <div className="clubImage">
                  {club.name === "AI Nexus"
                    ? "🤖"
                    : club.name ===
                      "Coding Club"
                    ? "💻"
                    : "⚙️"}
                </div>

                <div className="clubContent">
                  <span className="category">
                    RECOMMENDED CLUB
                  </span>

                  <h3>{club.name}</h3>

                  <p>{club.description}</p>

                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    ✦ {item.reason}
                  </div>

                  <div className="clubBottom">
                    <div className="members">
                      <Users size={16} />
                      {club.members} members
                    </div>

                    <button
                      className="iconButton"
                      onClick={() =>
                        onOpenClub(club)
                      }
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const event = item.data;

          const eventClub = clubs.find(
            (club) =>
              club.id === event.club_id
          );

          return (
            <div
              className="clubCard"
              key={item.id}
            >
              <div className="clubImage">
                📅
              </div>

              <div className="clubContent">
                <span className="category">
                  RECOMMENDED EVENT
                </span>

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "5px",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  <span>
                    ✦{" "}
                    {eventClub?.name ||
                      "Campus event"}
                  </span>

                  <span>
                    <CalendarDays
                      size={13}
                      style={{
                        verticalAlign:
                          "middle",
                        marginRight:
                          "4px",
                      }}
                    />

                    {event.date} ·{" "}
                    {event.time}
                  </span>
                </div>

                <div className="clubBottom">
                  <div className="members">
                    <MapPin size={16} />
                    {event.venue}
                  </div>

                  <button
                    className="iconButton"
                    onClick={() =>
                      onOpenEvent(event)
                    }
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* =========================================================
   STUDENT PARTICIPATION PROFILE
   ========================================================= */

function Profile({ userId = 1 }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = () => {
    setLoading(true);

    fetch(`${API}/students/${userId}/profile`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();

    const interval = setInterval(
      loadProfile,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  if (loading && !profile) {
    return (
      <main className="detailPage">
        <div className="loadingState">
          Loading your campus participation
          profile...
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="detailPage">
        <div className="emptyState">
          <ShieldCheck size={32} />

          <h3>
            Could not load your profile
          </h3>

          <p>
            Make sure the CampusLoop backend is
            running.
          </p>

          <button
            className="primaryButton"
            onClick={loadProfile}
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  const clubs = profile.clubs || [];
  const registeredEvents =
    profile.registered_events || [];
  const verifiedEvents =
    profile.verified_events || [];
  const contributions =
    profile.contributions || [];
  const stats = profile.stats || {};

  const verifiedEventIds = new Set(
    verifiedEvents.map(
      (event) => event.id
    )
  );

  const verificationRate =
    stats.events_registered
      ? Math.round(
          ((stats.events_attended || 0) /
            stats.events_registered) *
            100
        )
      : 0;

  const shareProfile = async () => {
    const profileUrl =
      `${window.location.origin}/?profile=1`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile.student.name}'s CampusLoop Profile`,
          text:
            "View my verified campus participation profile.",
          url: profileUrl,
        });
      } else if (
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(
          profileUrl
        );

        setMessage("Profile link copied!");
      } else {
        setMessage(
          "Profile link: " + profileUrl
        );
      }
    } catch {
      // User cancelled the share dialog.
    }
  };

  return (
    <main className="detailPage passportPage">
      <section className="passportHero">
        <div className="passportIdentity">
          <div className="profileAvatar">
            R
          </div>

          <div>
            <div className="eyebrow">
              CAMPUS PARTICIPATION PROFILE
            </div>

            <h1>
              {profile.student.name}
            </h1>

            <p>
              {profile.student.email}
            </p>

            <div className="studentStatus">
              <ShieldCheck size={16} />
              Campus participation profile
              active
            </div>
          </div>
        </div>

        <div className="passportActions">
          <button
            className="secondaryButton"
            onClick={shareProfile}
          >
            Share Profile
          </button>
        </div>
      </section>

      <section className="verificationStrip">
        <div className="verificationIcon">
          <ShieldCheck size={28} />
        </div>

        <div>
          <strong>
            Your campus journey in one place
          </strong>

          <span>
            Discover communities, participate in
            events and keep a record of your
            verified campus involvement.
          </span>
        </div>

        <CheckCircle2 size={24} />
      </section>

      <section className="profileStats passportStats">
        <div>
          <Users size={22} />

          <strong>
            {stats.clubs_joined || 0}
          </strong>

          <span>Communities</span>
        </div>

        <div>
          <CalendarDays size={22} />

          <strong>
            {stats.events_registered || 0}
          </strong>

          <span>Registered</span>
        </div>

        <div>
          <ShieldCheck size={22} />

          <strong>
            {stats.events_attended || 0}
          </strong>

          <span>Verified</span>
        </div>

        <div>
          <Award size={22} />

          <strong>
            {stats.contributions || 0}
          </strong>

          <span>Contributions</span>
        </div>
      </section>

      <section
        className="detailPanel"
        style={{
          marginBottom: "24px",
          padding: "22px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="eyebrow">
              <ShieldCheck size={14} />
              VERIFIED CAMPUS PASSPORT
            </div>

            <h2
              style={{
                margin: "6px 0",
              }}
            >
              Your participation, verified
            </h2>

            <p
              style={{
                margin: 0,
              }}
            >
              Only verified event attendance
              contributes to your participation
              record.
            </p>
          </div>

          <div
            style={{
              minWidth: "150px",
              textAlign: "center",
              padding: "16px 20px",
              borderRadius: "16px",
              background: "#f8fafc",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <strong
              style={{
                display: "block",
                fontSize: "30px",
              }}
            >
              {verificationRate}%
            </strong>

            <span
              style={{
                fontSize: "12px",
                color: "#64748b",
              }}
            >
              Verification rate
            </span>
          </div>
        </div>
      </section>

      <section className="passportGrid">
        <div className="detailPanel passportPanel">
          <div className="panelHeading">
            <div>
              <div className="eyebrow">
                COMMUNITIES
              </div>

              <h2>Your communities</h2>
            </div>

            <Users size={22} />
          </div>

          {clubs.length === 0 ? (
            <div className="emptyState">
              <Users size={30} />

              <p>
                Join your first campus
                community.
              </p>
            </div>
          ) : (
            clubs.map((club) => (
              <div
                className="passportClub"
                key={club.id}
              >
                <div className="passportClubIcon">
                  {club.name === "AI Nexus"
                    ? "🤖"
                    : club.name ===
                      "Coding Club"
                    ? "💻"
                    : "⚙️"}
                </div>

                <div className="passportClubInfo">
                  <strong>
                    {club.name}
                  </strong>

                  <span>
                    {club.category}
                  </span>
                </div>

                <div className="verifiedMini">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="detailPanel passportPanel">
          <div className="panelHeading">
            <div>
              <div className="eyebrow">
                CONTRIBUTIONS
              </div>

              <h2>
                How you contributed
              </h2>
            </div>

            <Award size={22} />
          </div>

          {contributions.length === 0 ? (
            <div className="emptyState">
              <Award size={30} />

              <p>
                Your contributions will
                appear here.
              </p>
            </div>
          ) : (
            contributions.map(
              (contribution) => (
                <div
                  className="contributionCard"
                  key={contribution.id}
                >
                  <div className="contributionIcon">
                    <Award size={20} />
                  </div>

                  <div>
                    <strong>
                      {contribution.title}
                    </strong>

                    <span>
                      {contribution.description}
                    </span>
                  </div>

                  <CheckCircle2 size={18} />
                </div>
              )
            )
          )}
        </div>
      </section>

      <section className="detailPanel timelinePanel">
        <div className="panelHeading">
          <div>
            <div className="eyebrow">
              EVENT REGISTRATIONS
            </div>

            <h2>
              Events you registered for
            </h2>
          </div>

          <CalendarDays size={22} />
        </div>

        {registeredEvents.length === 0 ? (
          <div className="emptyState">
            <CalendarDays size={30} />

            <p>
              You haven't registered for any
              events yet.
            </p>
          </div>
        ) : (
          <div className="registeredEventList">
            {registeredEvents.map((event) => {
              const isVerified =
                verifiedEventIds.has(
                  event.id
                );

              return (
                <div
                  className="registeredEventRow"
                  key={event.id}
                >
                  <div className="registeredEventIcon">
                    {isVerified ? (
                      <ShieldCheck size={21} />
                    ) : (
                      <CalendarDays size={21} />
                    )}
                  </div>

                  <div className="registeredEventInfo">
                    <strong>
                      {event.title}
                    </strong>

                    <span>
                      {event.date} ·{" "}
                      {event.time}
                    </span>

                    <span>
                      <MapPin size={14} />
                      {event.venue}
                    </span>
                  </div>

                  <div
                    className={
                      isVerified
                        ? "eventStatus verifiedStatus"
                        : "eventStatus registeredStatus"
                    }
                  >
                    {isVerified ? (
                      <>
                        <CheckCircle2 size={16} />
                        Verified
                      </>
                    ) : (
                      <>
                        <CalendarDays size={16} />
                        Registered
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="detailPanel timelinePanel">
        <div className="panelHeading">
          <div>
            <div className="eyebrow">
              VERIFIED PARTICIPATION
            </div>

            <h2>
              Your campus journey
            </h2>
          </div>

          <span className="verifiedLabel">
            <CheckCircle2 size={16} />

            {verifiedEvents.length} Verified
          </span>
        </div>

        {verifiedEvents.length === 0 ? (
          <div className="emptyState">
            <CalendarDays size={30} />

            <p>
              Attend your first event to start
              your verified journey.
            </p>
          </div>
        ) : (
          <div className="timeline">
            {verifiedEvents.map(
              (event, index) => (
                <div
                  className="timelineRow"
                  key={event.id}
                >
                  <div className="timelineMarker">
                    <div className="timelineNumber">
                      {index + 1}
                    </div>
                  </div>

                  <div className="timelineContent">
                    <div className="timelineTop">
                      <div>
                        <span className="timelineCategory">
                          VERIFIED EVENT
                        </span>

                        <h3>
                          {event.title}
                        </h3>
                      </div>

                      <CheckCircle2
                        size={22}
                        className="timelineCheck"
                      />
                    </div>

                    <div className="timelineMeta">
                      <span>
                        <CalendarDays
                          size={15}
                        />

                        {event.date}
                      </span>

                      <span>
                        <MapPin size={15} />

                        {event.venue}
                      </span>
                    </div>

                    <div className="attendanceVerified">
                      <ShieldCheck size={16} />

                      Attendance verified
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      <section className="passportAchievement">
        <div className="achievementIcon">
          <Trophy size={28} />
        </div>

        <div>
          <span className="eyebrow">
            CAMPUS PARTICIPATION
          </span>

          <h2>
            Keep building your campus journey
          </h2>

          <p>
            Join communities, participate in
            events and contribute to campus
            life. Your verified activities build
            a structured record of your
            involvement.
          </p>
        </div>

        <ChevronRight size={24} />
      </section>
    </main>
  );
}

/* =========================================================
   ATTENDANCE VERIFICATION
   ========================================================= */

function AttendanceModal({
  event,
  onClose,
  onSuccess,
}) {
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] =
    useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    fetch(
      `${API}/attendance/${event.id}/code`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setDemoCode(data.code);
        }
      })
      .catch(() => {
        setError(
          "Could not load attendance verification."
        );
      });
  }, [event.id]);

  const verify = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError(
        "Enter the attendance code."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API}/attendance/${event.id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code: code.trim(),
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
    } catch {
      setError(
        "Could not connect to backend."
      );
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="attendanceModal">
        <button
          className="modalClose"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="attendanceIcon">
          <ShieldCheck size={30} />
        </div>

        <div className="eyebrow">
          ATTENDANCE VERIFICATION
        </div>

        <h2>
          Verify your attendance
        </h2>

        <p className="attendanceDescription">
          Enter the verification code
          provided by the event organizer to
          confirm that you attended.
        </p>

        <div className="attendanceEvent">
          <CalendarDays size={18} />

          <div>
            <strong>
              {event.title}
            </strong>

            <span>
              {event.date} · {event.venue}
            </span>
          </div>
        </div>

        <form onSubmit={verify}>
          <label className="attendanceLabel">
            Verification code

            <div className="codeInput">
              <KeyRound size={18} />

              <input
                value={code}
                onChange={(e) => {
                  setCode(
                    e.target.value.toUpperCase()
                  );

                  setError("");
                }}
                placeholder="CL-0001"
                maxLength={7}
                autoFocus
              />
            </div>
          </label>

          {error && (
            <div className="attendanceError">
              {error}
            </div>
          )}

          <button
            className="primaryButton attendanceVerifyButton"
            type="submit"
            disabled={loading}
          >
            <CheckCircle2 size={18} />

            {loading
              ? "Verifying..."
              : "Verify Attendance"}
          </button>
        </form>

        {demoCode && (
          <div className="demoCode">
            <span>
              Demo organizer code
            </span>

            <strong>
              {demoCode}
            </strong>
          </div>
        )}

        <button
          className="attendanceCancel"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   QR CODE MODAL
   ========================================================= */

function AttendanceQrModal({
  event,
  onClose,
}) {
  const attendanceCode =
    event.attendance_code ||
    `CL-${String(event.id).padStart(
      4,
      "0"
    )}`;

  return (
    <div className="modalOverlay">
      <div className="attendanceModal">
        <button
          className="modalClose"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <div className="attendanceIcon">
          <QrCode size={30} />
        </div>

        <div className="eyebrow">
          EVENT ATTENDANCE
        </div>

        <h2>{event.title}</h2>

        <p className="attendanceDescription">
          Display this QR code at the event.
          Students can scan it to obtain the
          attendance verification code.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            margin: "24px 0",
            padding: "20px",
            background: "#ffffff",
            borderRadius: "18px",
            border:
              "1px solid #e5e7eb",
          }}
        >
          <QRCodeSVG
            value={attendanceCode}
            size={240}
            level="H"
            includeMargin
          />
        </div>

        <div className="demoCode">
          <span>
            Attendance code
          </span>

          <strong>
            {attendanceCode}
          </strong>
        </div>

        <button
          className="primaryButton attendanceVerifyButton"
          onClick={onClose}
        >
          <CheckCircle2 size={18} />
          Done
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   CLUB ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard() {
  const [dashboard, setDashboard] =
    useState(null);

  const [members, setMembers] =
    useState([]);

  const [membersLoading, setMembersLoading] =
    useState(false);

  const [roleUpdating, setRoleUpdating] =
    useState(null);

  const [showCreateEvent, setShowCreateEvent] =
    useState(false);

  const [
    showCreateAnnouncement,
    setShowCreateAnnouncement,
  ] = useState(false);

  const [message, setMessage] =
    useState("");

  const [copiedCode, setCopiedCode] =
    useState("");

  const [qrEvent, setQrEvent] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    capacity: 50,
  });

  const [
    announcementForm,
    setAnnouncementForm,
  ] = useState({
    title: "",
    message: "",
  });

  const boardRoles = [
    "General Member",
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Event Coordinator",
    "Technical Lead",
    "Design Lead",
    "Marketing Lead",
  ];

  /* ---------------------------------------------------------
     LOAD DASHBOARD
     --------------------------------------------------------- */

  const loadDashboard = () => {
    fetch(
      `${API}/admin/clubs/1/dashboard`
    )
      .then((res) => res.json())
      .then(setDashboard)
      .catch(() =>
        setMessage(
          "Could not load admin dashboard"
        )
      );
  };

  /* ---------------------------------------------------------
     LOAD CLUB MEMBERS
     --------------------------------------------------------- */

  const loadMembers = () => {
    setMembersLoading(true);

    fetch(
      `${API}/admin/clubs/1/members`
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            "Members request failed"
          );
        }

        return res.json();
      })
      .then((data) => {
        setMembers(
          data.members || []
        );

        setMembersLoading(false);
      })
      .catch(() => {
        setMembers([]);
        setMembersLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
    loadMembers();
  }, []);

  /* ---------------------------------------------------------
     UPDATE BOARD ROLE
     --------------------------------------------------------- */

  const updateBoardRole = async (
    member,
    boardRole
  ) => {
    if (!boardRole) {
      return;
    }

    setRoleUpdating(
      member.user_id
    );

    setMessage("");

    try {
      const res = await fetch(
        `${API}/admin/clubs/1/members/${member.user_id}/role?board_role=${encodeURIComponent(
          boardRole
        )}`,
        {
          method: "PUT",
        }
      );

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage(
          data.error ||
            "Could not update board role"
        );

        setRoleUpdating(null);
        return;
      }

      setMembers((current) =>
        current.map((item) =>
          item.user_id ===
          member.user_id
            ? {
                ...item,
                board_role:
                  data.member
                    ?.board_role ||
                  boardRole,
              }
            : item
        )
      );

      setMessage(
        `${member.name}'s role was updated to ${boardRole}.`
      );
    } catch {
      setMessage(
        "Could not connect to backend"
      );
    } finally {
      setRoleUpdating(null);
    }
  };

  /* ---------------------------------------------------------
     FORM HANDLERS
     --------------------------------------------------------- */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAnnouncementChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setAnnouncementForm(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  };

  /* ---------------------------------------------------------
     CREATE EVENT
     --------------------------------------------------------- */

  const createEvent = async (event) => {
    event.preventDefault();

    try {
      const res = await fetch(
        `${API}/admin/events`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            club_id: 1,
            title: form.title,
            description:
              form.description,
            date: form.date,
            time: form.time,
            venue: form.venue,
            capacity: Number(
              form.capacity
            ),
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        return;
      }

      setMessage(
        data.message ||
          "Event created successfully!"
      );

      setForm({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        capacity: 50,
      });

      setShowCreateEvent(false);
      loadDashboard();
    } catch {
      setMessage(
        "Could not connect to backend"
      );
    }
  };

  /* ---------------------------------------------------------
     CREATE ANNOUNCEMENT
     --------------------------------------------------------- */

  const createAnnouncement = async (
    event
  ) => {
    event.preventDefault();

    try {
      const res = await fetch(
        `${API}/admin/announcements`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            club_id: 1,
            title:
              announcementForm.title,
            message:
              announcementForm.message,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
        return;
      }

      setMessage(
        data.message ||
          "Announcement published successfully!"
      );

      setAnnouncementForm({
        title: "",
        message: "",
      });

      setShowCreateAnnouncement(false);
      loadDashboard();
    } catch {
      setMessage(
        "Could not connect to backend"
      );
    }
  };

  /* ---------------------------------------------------------
     COPY ATTENDANCE CODE
     --------------------------------------------------------- */

  const copyAttendanceCode = async (
    event
  ) => {
    const code =
      event.attendance_code ||
      `CL-${String(event.id).padStart(
        4,
        "0"
      )}`;

    try {
      await navigator.clipboard.writeText(
        code
      );

      setCopiedCode(code);
      setMessage(
        "Attendance code copied!"
      );

      setTimeout(() => {
        setCopiedCode("");
      }, 2000);
    } catch {
      setMessage(
        "Could not copy attendance code"
      );
    }
  };

  if (!dashboard) {
    return (
      <main className="detailPage adminPage">
        <div className="loadingState">
          Loading club administration...
        </div>
      </main>
    );
  }

  const stats = dashboard.stats;
  const club = dashboard.club;
  const adminEvents =
    dashboard.events || [];
  const announcements =
    dashboard.announcements || [];

  const leadershipMembers =
    members.filter(
      (member) =>
        member.board_role &&
        member.board_role !==
          "General Member"
    );

  return (
    <main className="detailPage adminPage">
      {/* =====================================================
          ADMIN HEADER
          ===================================================== */}

      <section className="adminHero">
        <div className="adminIdentity">
          <div className="adminLogo">
            <LayoutDashboard size={30} />
          </div>

          <div>
            <div className="eyebrow">
              CLUB ADMINISTRATION
            </div>

            <h1>{club.name}</h1>

            <p>
              Manage your community, organize
              events and track verified
              participation.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            className="secondaryButton large"
            onClick={() =>
              setShowCreateAnnouncement(
                true
              )
            }
          >
            <Megaphone size={18} />
            Announcement
          </button>

          <button
            className="primaryButton large"
            onClick={() =>
              setShowCreateEvent(true)
            }
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>
      </section>

      {message && (
        <div className="adminMessage">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {/* =====================================================
          ADMIN STATS
          ===================================================== */}

      <section className="adminStats">
        <div className="adminStat">
          <div className="adminStatIcon">
            <Users size={22} />
          </div>

          <div>
            <span>Members</span>
            <strong>
              {stats.members}
            </strong>
          </div>
        </div>

        <div className="adminStat">
          <div className="adminStatIcon">
            <CalendarDays size={22} />
          </div>

          <div>
            <span>Events</span>
            <strong>
              {stats.events}
            </strong>
          </div>
        </div>

        <div className="adminStat">
          <div className="adminStatIcon">
            <BarChart3 size={22} />
          </div>

          <div>
            <span>Registrations</span>
            <strong>
              {stats.registrations}
            </strong>
          </div>
        </div>

        <div className="adminStat">
          <div className="adminStatIcon">
            <ClipboardCheck size={22} />
          </div>

          <div>
            <span>
              Verified Attendance
            </span>

            <strong>
              {stats.verified_attendance}
            </strong>
          </div>
        </div>

        <div className="adminStat">
          <div className="adminStatIcon">
            <Megaphone size={22} />
          </div>

          <div>
            <span>
              Announcements
            </span>

            <strong>
              {stats.announcements ||
                announcements.length}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          MEMBER DIRECTORY
          ===================================================== */}

      <section className="adminEvents">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">
              COMMUNITY MEMBERS
            </div>

            <h2>
              Member directory
            </h2>

            <p>
              {members.length} member
              {members.length !== 1
                ? "s"
                : ""}{" "}
              in {club.name}
            </p>
          </div>

          <button
            className="secondaryButton"
            onClick={loadMembers}
            disabled={membersLoading}
          >
            <Users size={17} />

            {membersLoading
              ? "Refreshing..."
              : "Refresh Members"}
          </button>
        </div>

        {membersLoading &&
        members.length === 0 ? (
          <div className="loadingState">
            Loading club members...
          </div>
        ) : members.length === 0 ? (
          <div className="emptyState">
            <Users size={32} />

            <h3>
              No members yet
            </h3>

            <p>
              Students who join this club
              will appear here.
            </p>
          </div>
        ) : (
          <>
            {leadershipMembers.length >
              0 && (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "18px",
                  borderRadius:
                    "18px",
                  border:
                    "1px solid #e5e7eb",
                  background:
                    "linear-gradient(135deg, #fafafa, #f8fafc)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: "10px",
                    marginBottom:
                      "14px",
                  }}
                >
                  <Crown size={20} />

                  <div>
                    <strong>
                      Club leadership
                    </strong>

                    <span
                      style={{
                        display:
                          "block",
                        marginTop:
                          "2px",
                        fontSize:
                          "13px",
                        color:
                          "#64748b",
                      }}
                    >
                      Current board
                      members
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap:
                      "wrap",
                  }}
                >
                  {leadershipMembers.map(
                    (member) => (
                      <div
                        key={
                          member.user_id
                        }
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "9px",
                          padding:
                            "9px 12px",
                          borderRadius:
                            "12px",
                          background:
                            "#ffffff",
                          border:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <Crown size={15} />

                        <span
                          style={{
                            fontWeight:
                              600,
                            fontSize:
                              "13px",
                          }}
                        >
                          {member.name}
                        </span>

                        <span
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            member.board_role
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "14px",
                marginBottom:
                  "36px",
              }}
            >
              {members.map(
                (member) => {
                  const currentRole =
                    member.board_role ||
                    "General Member";

                  const isUpdating =
                    roleUpdating ===
                    member.user_id;

                  return (
                    <div
                      key={
                        member.membership_id
                      }
                      className="detailPanel"
                      style={{
                        padding:
                          "18px",
                        margin: 0,
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "14px",
                        }}
                      >
                        <div
                          style={{
                            width:
                              "46px",
                            height:
                              "46px",
                            minWidth:
                              "46px",
                            borderRadius:
                              "50%",
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            background:
                              "#eef2ff",
                            fontWeight:
                              700,
                            fontSize:
                              "17px",
                          }}
                        >
                          {member.name
                            ? member.name.charAt(
                                0
                              ).toUpperCase()
                            : "U"}
                        </div>

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >
                          <strong
                            style={{
                              display:
                                "block",
                              marginBottom:
                                "4px",
                            }}
                          >
                            {member.name}
                          </strong>

                          <span
                            style={{
                              display:
                                "block",
                              fontSize:
                                "13px",
                              color:
                                "#64748b",
                              wordBreak:
                                "break-word",
                            }}
                          >
                            {member.email}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "15px",
                          padding:
                            "12px",
                          borderRadius:
                            "12px",
                          background:
                            "#f8fafc",
                          border:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "8px",
                            marginBottom:
                              "8px",
                          }}
                        >
                          <UserCog
                            size={16}
                          />

                          <span
                            style={{
                              fontSize:
                                "12px",
                              fontWeight:
                                700,
                              textTransform:
                                "uppercase",
                              letterSpacing:
                                "0.04em",
                              color:
                                "#64748b",
                            }}
                          >
                            Board role
                          </span>
                        </div>

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: "10px",
                          }}
                        >
                          <select
                            value={
                              currentRole
                            }
                            disabled={
                              isUpdating
                            }
                            onChange={(
                              e
                            ) =>
                              updateBoardRole(
                                member,
                                e.target
                                  .value
                              )
                            }
                            style={{
                              flex: 1,
                              minWidth: 0,
                              padding:
                                "10px 12px",
                              borderRadius:
                                "10px",
                              border:
                                "1px solid #d1d5db",
                              background:
                                "#ffffff",
                              fontSize:
                                "14px",
                              cursor:
                                isUpdating
                                  ? "wait"
                                  : "pointer",
                            }}
                          >
                            {boardRoles.map(
                              (
                                role
                              ) => (
                                <option
                                  key={
                                    role
                                  }
                                  value={
                                    role
                                  }
                                >
                                  {role}
                                </option>
                              )
                            )}
                          </select>

                          {isUpdating && (
                            <span
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#64748b",
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              Saving...
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop:
                            "13px",
                          paddingTop:
                            "13px",
                          borderTop:
                            "1px solid #e5e7eb",
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                        }}
                      >
                        <span className="category">
                          {currentRole ===
                          "General Member"
                            ? "MEMBER"
                            : "BOARD"}
                        </span>

                        <span
                          style={{
                            fontSize:
                              "13px",
                            color:
                              "#64748b",
                          }}
                        >
                          ID #
                          {
                            member.user_id
                          }
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </>
        )}
      </section>

      {/* =====================================================
          ANNOUNCEMENTS
          ===================================================== */}

      <section className="adminEvents">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">
              ANNOUNCEMENTS
            </div>

            <h2>
              Community updates
            </h2>
          </div>

          <button
            className="secondaryButton"
            onClick={() =>
              setShowCreateAnnouncement(
                true
              )
            }
          >
            <Plus size={17} />
            New Announcement
          </button>
        </div>

        {announcements.length ===
        0 ? (
          <div className="emptyState">
            <Megaphone size={32} />

            <p>
              No announcements published
              yet.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection:
                "column",
              gap: "12px",
              marginBottom:
                "36px",
            }}
          >
            {announcements.map(
              (announcement) => (
                <div
                  key={
                    announcement.id
                  }
                  className="detailPanel"
                  style={{
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      gap: "14px",
                      alignItems:
                        "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        minWidth:
                          "42px",
                        borderRadius:
                          "12px",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "#eef2ff",
                      }}
                    >
                      <Megaphone
                        size={20}
                      />
                    </div>

                    <div>
                      <span className="category">
                        ANNOUNCEMENT
                      </span>

                      <h3
                        style={{
                          margin:
                            "5px 0",
                        }}
                      >
                        {
                          announcement.title
                        }
                      </h3>

                      <p
                        style={{
                          margin: 0,
                        }}
                      >
                        {
                          announcement.message
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          EVENT MANAGEMENT
          ===================================================== */}

      <section className="adminEvents">
        <div className="sectionHeader">
          <div>
            <div className="eyebrow">
              EVENT MANAGEMENT
            </div>

            <h2>Your events</h2>
          </div>

          <button
            className="secondaryButton"
            onClick={() =>
              setShowCreateEvent(true)
            }
          >
            <Plus size={17} />
            New Event
          </button>
        </div>

        <div className="adminEventList">
          {adminEvents.length ===
          0 ? (
            <div className="emptyState">
              <CalendarDays size={32} />

              <p>
                No events created yet.
              </p>
            </div>
          ) : (
            adminEvents.map(
              (event) => {
                const percentage =
                  event.capacity > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (event.registered /
                            event.capacity) *
                            100
                        )
                      )
                    : 0;

                const attendanceCode =
                  event.attendance_code ||
                  `CL-${String(
                    event.id
                  ).padStart(
                    4,
                    "0"
                  )}`;

                return (
                  <div
                    className="adminEvent"
                    key={event.id}
                  >
                    <div className="adminEventDate">
                      <CalendarDays
                        size={20}
                      />

                      <strong>
                        {event.date?.split(
                          " "
                        )[0]}
                      </strong>

                      <span>
                        {event.date?.split(
                          " "
                        )[1]}
                      </span>
                    </div>

                    <div className="adminEventMain">
                      <div>
                        <span className="category">
                          EVENT
                        </span>

                        <h3>
                          {event.title}
                        </h3>

                        <p>
                          {
                            event.description
                          }
                        </p>

                        <div className="eventMeta">
                          <span>
                            <MapPin
                              size={
                                15
                              }
                            />

                            {
                              event.venue
                            }
                          </span>

                          <span>
                            <Clock
                              size={
                                15
                              }
                            />

                            {
                              event.time
                            }
                          </span>
                        </div>
                      </div>

                      <div className="registrationMeter">
                        <div className="registrationTop">
                          <span>
                            Registrations
                          </span>

                          <strong>
                            {
                              event.registered
                            }
                            /
                            {
                              event.capacity
                            }
                          </strong>
                        </div>

                        <div className="meter">
                          <div
                            className="meterFill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <small>
                          {percentage}%
                          capacity
                        </small>
                      </div>
                    </div>

                    <div className="attendanceCodeBox">
                      <div className="attendanceCodeInfo">
                        <span>
                          ATTENDANCE CODE
                        </span>

                        <strong>
                          {
                            attendanceCode
                          }
                        </strong>
                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap: "8px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          className="secondaryButton"
                          onClick={() =>
                            copyAttendanceCode(
                              event
                            )
                          }
                        >
                          {copiedCode ===
                          attendanceCode ? (
                            <>
                              <Check
                                size={
                                  16
                                }
                              />

                              Copied
                            </>
                          ) : (
                            <>
                              <Copy
                                size={
                                  16
                                }
                              />

                              Copy Code
                            </>
                          )}
                        </button>

                        <button
                          className="primaryButton"
                          onClick={() =>
                            setQrEvent(
                              event
                            )
                          }
                        >
                          <QrCode
                            size={
                              16
                            }
                          />

                          Show QR
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </section>

      {/* =====================================================
          CREATE EVENT MODAL
          ===================================================== */}

      {showCreateEvent && (
        <div className="modalOverlay">
          <div className="createModal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  CLUB ADMIN
                </div>

                <h2>
                  Create a new event
                </h2>
              </div>

              <button
                className="modalClose"
                onClick={() =>
                  setShowCreateEvent(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={createEvent}
            >
              <label>
                Event title

                <input
                  name="title"
                  value={form.title}
                  onChange={
                    handleChange
                  }
                  placeholder="e.g. AI Workshop"
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  name="description"
                  value={
                    form.description
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Tell students what this event is about..."
                  rows="4"
                  required
                />
              </label>

              <div className="formRow">
                <label>
                  Date

                  <input
                    name="date"
                    value={form.date}
                    onChange={
                      handleChange
                    }
                    placeholder="04 Oct 2026"
                    required
                  />
                </label>

                <label>
                  Time

                  <input
                    name="time"
                    value={form.time}
                    onChange={
                      handleChange
                    }
                    placeholder="10:00 AM"
                    required
                  />
                </label>
              </div>

              <div className="formRow">
                <label>
                  Venue

                  <input
                    name="venue"
                    value={form.venue}
                    onChange={
                      handleChange
                    }
                    placeholder="Innovation Lab"
                    required
                  />
                </label>

                <label>
                  Capacity

                  <input
                    type="number"
                    name="capacity"
                    value={
                      form.capacity
                    }
                    onChange={
                      handleChange
                    }
                    min="1"
                    required
                  />
                </label>
              </div>

              <div className="modalActions">
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() =>
                    setShowCreateEvent(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primaryButton"
                >
                  <Plus size={17} />
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          CREATE ANNOUNCEMENT MODAL
          ===================================================== */}

      {showCreateAnnouncement && (
        <div className="modalOverlay">
          <div className="createModal">
            <div className="modalHeader">
              <div>
                <div className="eyebrow">
                  CLUB ADMIN
                </div>

                <h2>
                  Publish announcement
                </h2>
              </div>

              <button
                className="modalClose"
                onClick={() =>
                  setShowCreateAnnouncement(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                createAnnouncement
              }
            >
              <label>
                Announcement title

                <input
                  name="title"
                  value={
                    announcementForm.title
                  }
                  onChange={
                    handleAnnouncementChange
                  }
                  placeholder="e.g. AI Hackathon Reminder"
                  required
                />
              </label>

              <label>
                Message

                <textarea
                  name="message"
                  value={
                    announcementForm.message
                  }
                  onChange={
                    handleAnnouncementChange
                  }
                  placeholder="Write the announcement students should see..."
                  rows="5"
                  required
                />
              </label>

              <div
                style={{
                  display:
                    "flex",
                  gap: "10px",
                  alignItems:
                    "center",
                  padding:
                    "12px 14px",
                  borderRadius:
                    "12px",
                  background:
                    "#f8fafc",
                  marginBottom:
                    "18px",
                  fontSize:
                    "13px",
                }}
              >
                <Bell size={17} />

                <span>
                  Club members will
                  receive this
                  announcement as a
                  notification.
                </span>
              </div>

              <div className="modalActions">
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() =>
                    setShowCreateAnnouncement(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primaryButton"
                >
                  <Megaphone
                    size={17}
                  />

                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          QR MODAL
          ===================================================== */}

      {qrEvent && (
        <AttendanceQrModal
          event={qrEvent}
          onClose={() =>
            setQrEvent(null)
          }
        />
      )}
    </main>
  );
}


function CampusBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let mouseX = 0.5;
    let mouseY = 0.5;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const particles = [];
    const packetCount = 9;
    const packets = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        82,
        Math.max(38, Math.floor((width * height) / 18000))
      );

      particles.length = 0;

      for (let index = 0; index < count; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          radius: Math.random() * 1.7 + 0.7,
          phase: Math.random() * Math.PI * 2,
          accent: index % 7 === 0 ? "orange" : index % 3 === 0 ? "teal" : "cyan",
        });
      }

      packets.length = 0;
      for (let index = 0; index < packetCount; index += 1) {
        packets.push({
          index,
          progress: Math.random(),
          speed: 0.0007 + Math.random() * 0.001,
        });
      }
    };

    const pointerMove = (event) => {
      mouseX = event.clientX / Math.max(width, 1);
      mouseY = event.clientY / Math.max(height, 1);
    };

    const pointerLeave = () => {
      mouseX = 0.5;
      mouseY = 0.5;
    };

    const draw = (time) => {
      context.clearRect(0, 0, width, height);

      const parallaxX = (mouseX - 0.5) * 18;
      const parallaxY = (mouseY - 0.5) * 18;

      context.save();
      context.translate(parallaxX, parallaxY);

      const connectionDistance = width < 700 ? 105 : 145;

      for (let first = 0; first < particles.length; first += 1) {
        const particle = particles[first];

        if (!reducedMotion.matches) {
          particle.x += particle.vx;
          particle.y += particle.vy;
        }

        if (particle.x < -30) particle.x = width + 30;
        if (particle.x > width + 30) particle.x = -30;
        if (particle.y < -30) particle.y = height + 30;
        if (particle.y > height + 30) particle.y = -30;

        const pulse = 0.45 + Math.sin(time * 0.001 + particle.phase) * 0.2;
        const color =
          particle.accent === "orange"
            ? `rgba(249,115,22,${pulse})`
            : particle.accent === "teal"
              ? `rgba(20,184,166,${pulse})`
              : `rgba(6,182,212,${pulse})`;

        context.beginPath();
        context.fillStyle = color;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        for (let second = first + 1; second < particles.length; second += 1) {
          const other = particles[second];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15;
            context.beginPath();
            context.strokeStyle = `rgba(15,23,42,${opacity})`;
            context.lineWidth = 0.7;
            context.moveTo(particle.x, particle.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }
      }

      const horizon = height * 0.82;
      context.beginPath();
      context.strokeStyle = "rgba(15,23,42,0.055)";
      context.lineWidth = 1;
      context.moveTo(-50, horizon);
      context.lineTo(width + 50, horizon);
      context.stroke();

      for (let line = -8; line <= 8; line += 1) {
        const x = width / 2 + line * (width / 9);
        context.beginPath();
        context.strokeStyle = "rgba(6,182,212,0.045)";
        context.moveTo(width / 2, horizon);
        context.lineTo(x, height + 30);
        context.stroke();
      }

      const packetRadius = Math.max(3, Math.min(5, width / 260));
      packets.forEach((packet) => {
        if (!reducedMotion.matches) {
          packet.progress += packet.speed * 16.67;
          if (packet.progress > 1) packet.progress = 0;
        }

        const lane = packet.index % 5;
        const startX = width * (0.12 + lane * 0.17);
        const endX = width * (0.84 - lane * 0.09);
        const startY = height * (0.22 + (lane % 3) * 0.12);
        const endY = height * (0.64 + (lane % 2) * 0.12);
        const progress = packet.progress;
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        const orange = packet.index % 4 === 0;

        context.beginPath();
        context.fillStyle = orange ? "#f97316" : "#06b6d4";
        context.shadowColor = orange
          ? "rgba(249,115,22,0.55)"
          : "rgba(6,182,212,0.55)";
        context.shadowBlur = 12;
        context.arc(x, y, packetRadius, 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      });

      context.restore();

      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointerleave", pointerLeave);
    animationFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerleave", pointerLeave);
    };
  }, []);

  return (
    <div className="campusCanvasBackground" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}

function HeroNetwork() {
  return (
    <div className="heroNetwork" aria-hidden="true">
      <div className="heroEnergyField">
        <span className="heroParticle p001 teal" aria-hidden="true" />
        <span className="heroParticle p002 orange" aria-hidden="true" />
        <span className="heroParticle p003 lime" aria-hidden="true" />
        <span className="heroParticle p004 ink" aria-hidden="true" />
        <span className="heroParticle p005 teal" aria-hidden="true" />
        <span className="heroParticle p006 orange" aria-hidden="true" />
        <span className="heroParticle p007 lime" aria-hidden="true" />
        <span className="heroParticle p008 ink" aria-hidden="true" />
        <span className="heroParticle p009 teal" aria-hidden="true" />
        <span className="heroParticle p010 orange" aria-hidden="true" />
        <span className="heroParticle p011 lime" aria-hidden="true" />
        <span className="heroParticle p012 ink" aria-hidden="true" />
        <span className="heroParticle p013 teal" aria-hidden="true" />
        <span className="heroParticle p014 orange" aria-hidden="true" />
        <span className="heroParticle p015 lime" aria-hidden="true" />
        <span className="heroParticle p016 ink" aria-hidden="true" />
        <span className="heroParticle p017 teal" aria-hidden="true" />
        <span className="heroParticle p018 orange" aria-hidden="true" />
        <span className="heroParticle p019 lime" aria-hidden="true" />
        <span className="heroParticle p020 ink" aria-hidden="true" />
        <span className="heroParticle p021 teal" aria-hidden="true" />
        <span className="heroParticle p022 orange" aria-hidden="true" />
        <span className="heroParticle p023 lime" aria-hidden="true" />
        <span className="heroParticle p024 ink" aria-hidden="true" />
        <span className="heroParticle p025 teal" aria-hidden="true" />
        <span className="heroParticle p026 orange" aria-hidden="true" />
        <span className="heroParticle p027 lime" aria-hidden="true" />
        <span className="heroParticle p028 ink" aria-hidden="true" />
        <span className="heroParticle p029 teal" aria-hidden="true" />
        <span className="heroParticle p030 orange" aria-hidden="true" />
        <span className="heroParticle p031 lime" aria-hidden="true" />
        <span className="heroParticle p032 ink" aria-hidden="true" />
        <span className="heroParticle p033 teal" aria-hidden="true" />
        <span className="heroParticle p034 orange" aria-hidden="true" />
        <span className="heroParticle p035 lime" aria-hidden="true" />
        <span className="heroParticle p036 ink" aria-hidden="true" />
        <span className="heroParticle p037 teal" aria-hidden="true" />
        <span className="heroParticle p038 orange" aria-hidden="true" />
        <span className="heroParticle p039 lime" aria-hidden="true" />
        <span className="heroParticle p040 ink" aria-hidden="true" />
        <span className="heroParticle p041 teal" aria-hidden="true" />
        <span className="heroParticle p042 orange" aria-hidden="true" />
        <span className="heroParticle p043 lime" aria-hidden="true" />
        <span className="heroParticle p044 ink" aria-hidden="true" />
        <span className="heroParticle p045 teal" aria-hidden="true" />
        <span className="heroParticle p046 orange" aria-hidden="true" />
        <span className="heroParticle p047 lime" aria-hidden="true" />
        <span className="heroParticle p048 ink" aria-hidden="true" />
        <span className="heroParticle p049 teal" aria-hidden="true" />
        <span className="heroParticle p050 orange" aria-hidden="true" />
        <span className="heroParticle p051 lime" aria-hidden="true" />
        <span className="heroParticle p052 ink" aria-hidden="true" />
        <span className="heroParticle p053 teal" aria-hidden="true" />
        <span className="heroParticle p054 orange" aria-hidden="true" />
        <span className="heroParticle p055 lime" aria-hidden="true" />
        <span className="heroParticle p056 ink" aria-hidden="true" />
        <span className="heroParticle p057 teal" aria-hidden="true" />
        <span className="heroParticle p058 orange" aria-hidden="true" />
        <span className="heroParticle p059 lime" aria-hidden="true" />
        <span className="heroParticle p060 ink" aria-hidden="true" />
        <span className="heroParticle p061 teal" aria-hidden="true" />
        <span className="heroParticle p062 orange" aria-hidden="true" />
        <span className="heroParticle p063 lime" aria-hidden="true" />
        <span className="heroParticle p064 ink" aria-hidden="true" />
        <span className="heroParticle p065 teal" aria-hidden="true" />
        <span className="heroParticle p066 orange" aria-hidden="true" />
        <span className="heroParticle p067 lime" aria-hidden="true" />
        <span className="heroParticle p068 ink" aria-hidden="true" />
        <span className="heroParticle p069 teal" aria-hidden="true" />
        <span className="heroParticle p070 orange" aria-hidden="true" />
        <span className="heroParticle p071 lime" aria-hidden="true" />
        <span className="heroParticle p072 ink" aria-hidden="true" />
        <span className="heroParticle p073 teal" aria-hidden="true" />
        <span className="heroParticle p074 orange" aria-hidden="true" />
        <span className="heroParticle p075 lime" aria-hidden="true" />
        <span className="heroParticle p076 ink" aria-hidden="true" />
        <span className="heroParticle p077 teal" aria-hidden="true" />
        <span className="heroParticle p078 orange" aria-hidden="true" />
        <span className="heroParticle p079 lime" aria-hidden="true" />
        <span className="heroParticle p080 ink" aria-hidden="true" />
        <span className="heroParticle p081 teal" aria-hidden="true" />
        <span className="heroParticle p082 orange" aria-hidden="true" />
        <span className="heroParticle p083 lime" aria-hidden="true" />
        <span className="heroParticle p084 ink" aria-hidden="true" />
        <span className="heroParticle p085 teal" aria-hidden="true" />
        <span className="heroParticle p086 orange" aria-hidden="true" />
        <span className="heroParticle p087 lime" aria-hidden="true" />
        <span className="heroParticle p088 ink" aria-hidden="true" />
        <span className="heroParticle p089 teal" aria-hidden="true" />
        <span className="heroParticle p090 orange" aria-hidden="true" />
        <span className="heroParticle p091 lime" aria-hidden="true" />
        <span className="heroParticle p092 ink" aria-hidden="true" />
        <span className="heroParticle p093 teal" aria-hidden="true" />
        <span className="heroParticle p094 orange" aria-hidden="true" />
        <span className="heroParticle p095 lime" aria-hidden="true" />
        <span className="heroParticle p096 ink" aria-hidden="true" />
        <span className="heroParticle p097 teal" aria-hidden="true" />
        <span className="heroParticle p098 orange" aria-hidden="true" />
        <span className="heroParticle p099 lime" aria-hidden="true" />
        <span className="heroParticle p100 ink" aria-hidden="true" />
        <span className="heroParticle p101 teal" aria-hidden="true" />
        <span className="heroParticle p102 orange" aria-hidden="true" />
        <span className="heroParticle p103 lime" aria-hidden="true" />
        <span className="heroParticle p104 ink" aria-hidden="true" />
        <span className="heroParticle p105 teal" aria-hidden="true" />
        <span className="heroParticle p106 orange" aria-hidden="true" />
        <span className="heroParticle p107 lime" aria-hidden="true" />
        <span className="heroParticle p108 ink" aria-hidden="true" />
        <span className="heroParticle p109 teal" aria-hidden="true" />
        <span className="heroParticle p110 orange" aria-hidden="true" />
        <span className="heroParticle p111 lime" aria-hidden="true" />
        <span className="heroParticle p112 ink" aria-hidden="true" />
        <span className="heroParticle p113 teal" aria-hidden="true" />
        <span className="heroParticle p114 orange" aria-hidden="true" />
        <span className="heroParticle p115 lime" aria-hidden="true" />
        <span className="heroParticle p116 ink" aria-hidden="true" />
        <span className="heroParticle p117 teal" aria-hidden="true" />
        <span className="heroParticle p118 orange" aria-hidden="true" />
        <span className="heroParticle p119 lime" aria-hidden="true" />
        <span className="heroParticle p120 ink" aria-hidden="true" />
        <span className="heroParticle p121 teal" aria-hidden="true" />
        <span className="heroParticle p122 orange" aria-hidden="true" />
        <span className="heroParticle p123 lime" aria-hidden="true" />
        <span className="heroParticle p124 ink" aria-hidden="true" />
        <span className="heroParticle p125 teal" aria-hidden="true" />
        <span className="heroParticle p126 orange" aria-hidden="true" />
        <span className="heroParticle p127 lime" aria-hidden="true" />
        <span className="heroParticle p128 ink" aria-hidden="true" />
        <span className="heroParticle p129 teal" aria-hidden="true" />
        <span className="heroParticle p130 orange" aria-hidden="true" />
        <span className="heroParticle p131 lime" aria-hidden="true" />
        <span className="heroParticle p132 ink" aria-hidden="true" />
        <span className="heroParticle p133 teal" aria-hidden="true" />
        <span className="heroParticle p134 orange" aria-hidden="true" />
        <span className="heroParticle p135 lime" aria-hidden="true" />
        <span className="heroParticle p136 ink" aria-hidden="true" />
        <span className="heroParticle p137 teal" aria-hidden="true" />
        <span className="heroParticle p138 orange" aria-hidden="true" />
        <span className="heroParticle p139 lime" aria-hidden="true" />
        <span className="heroParticle p140 ink" aria-hidden="true" />
        <span className="heroParticle p141 teal" aria-hidden="true" />
        <span className="heroParticle p142 orange" aria-hidden="true" />
        <span className="heroParticle p143 lime" aria-hidden="true" />
        <span className="heroParticle p144 ink" aria-hidden="true" />
        <span className="heroParticle p145 teal" aria-hidden="true" />
        <span className="heroParticle p146 orange" aria-hidden="true" />
        <span className="heroParticle p147 lime" aria-hidden="true" />
        <span className="heroParticle p148 ink" aria-hidden="true" />
        <span className="heroParticle p149 teal" aria-hidden="true" />
        <span className="heroParticle p150 orange" aria-hidden="true" />
        <span className="heroParticle p151 lime" aria-hidden="true" />
        <span className="heroParticle p152 ink" aria-hidden="true" />
        <span className="heroParticle p153 teal" aria-hidden="true" />
        <span className="heroParticle p154 orange" aria-hidden="true" />
        <span className="heroParticle p155 lime" aria-hidden="true" />
        <span className="heroParticle p156 ink" aria-hidden="true" />
        <span className="heroParticle p157 teal" aria-hidden="true" />
        <span className="heroParticle p158 orange" aria-hidden="true" />
        <span className="heroParticle p159 lime" aria-hidden="true" />
        <span className="heroParticle p160 ink" aria-hidden="true" />
        <span className="heroParticle p161 teal" aria-hidden="true" />
        <span className="heroParticle p162 orange" aria-hidden="true" />
        <span className="heroParticle p163 lime" aria-hidden="true" />
        <span className="heroParticle p164 ink" aria-hidden="true" />
        <span className="heroParticle p165 teal" aria-hidden="true" />
        <span className="heroParticle p166 orange" aria-hidden="true" />
        <span className="heroParticle p167 lime" aria-hidden="true" />
        <span className="heroParticle p168 ink" aria-hidden="true" />
        <span className="heroParticle p169 teal" aria-hidden="true" />
        <span className="heroParticle p170 orange" aria-hidden="true" />
        <span className="heroParticle p171 lime" aria-hidden="true" />
        <span className="heroParticle p172 ink" aria-hidden="true" />
        <span className="heroParticle p173 teal" aria-hidden="true" />
        <span className="heroParticle p174 orange" aria-hidden="true" />
        <span className="heroParticle p175 lime" aria-hidden="true" />
        <span className="heroParticle p176 ink" aria-hidden="true" />
        <span className="heroParticle p177 teal" aria-hidden="true" />
        <span className="heroParticle p178 orange" aria-hidden="true" />
        <span className="heroParticle p179 lime" aria-hidden="true" />
        <span className="heroParticle p180 ink" aria-hidden="true" />
      </div>

      <div className="heroCornerTicks" />
      <div className="heroScanBeam" />
      <div className="heroPulseDisc" />

      <div className="heroNetworkBadge left">
        <span className="heroNetworkBadgeDot" />
        Live campus mesh
      </div>

      <div className="heroNetworkBadge right">
        <span className="heroNetworkBadgeDot" />
        Verified activity
      </div>

      <div className="heroFloatingCard one">
        <strong>24/7</strong>
        <span>Campus discovery</span>
      </div>

      <div className="heroFloatingCard two">
        <strong>LIVE</strong>
        <span>Event signals</span>
      </div>

      <div className="heroFloatingCard three">
        <strong>✓</strong>
        <span>Verified record</span>
      </div>

      <svg
        className="heroNetworkSvg"
        viewBox="0 0 420 360"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="campusGlowTeal" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="campusGlowOrange" x="-200%" y="-200%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="networkOrbitSystem">
          <ellipse className="networkOrbit ellipseA" cx="210" cy="154" rx="82" ry="34" />
          <ellipse className="networkOrbit ellipseB" cx="210" cy="154" rx="126" ry="57" />
          <ellipse className="networkOrbit ellipseC" cx="210" cy="154" rx="160" ry="92" />
          <ellipse className="networkOrbit ellipseD" cx="210" cy="154" rx="178" ry="116" />
        </g>

        <g className="networkEnergyLinks">
        <line className="energyLink" x1="48" y1="72" x2="102" y2="54" />
        <line className="energyLink" x1="102" y1="54" x2="154" y2="82" />
        <line className="energyLink" x1="102" y1="54" x2="188" y2="122" />
        <line className="energyLink" x1="154" y1="82" x2="214" y2="50" />
        <line className="energyLink" x1="214" y1="50" x2="276" y2="74" />
        <line className="energyLink" x1="276" y1="74" x2="348" y2="55" />
        <line className="energyLink" x1="348" y1="55" x2="382" y2="112" />
        <line className="energyLink" x1="48" y1="72" x2="68" y2="160" />
        <line className="energyLink" x1="68" y1="160" x2="124" y2="142" />
        <line className="energyLink" x1="124" y1="142" x2="188" y2="122" />
        <line className="energyLink" x1="188" y1="122" x2="244" y2="142" />
        <line className="energyLink" x1="244" y1="142" x2="304" y2="128" />
        <line className="energyLink" x1="304" y1="128" x2="356" y2="172" />
        <line className="energyLink" x1="68" y1="160" x2="138" y2="226" />
        <line className="energyLink" x1="124" y1="142" x2="138" y2="226" />
        <line className="energyLink" x1="188" y1="122" x2="198" y2="252" />
        <line className="energyLink" x1="244" y1="142" x2="260" y2="226" />
        <line className="energyLink" x1="304" y1="128" x2="318" y2="252" />
        <line className="energyLink" x1="356" y1="172" x2="374" y2="238" />
        <line className="energyLink" x1="74" y1="248" x2="138" y2="226" />
        <line className="energyLink" x1="138" y1="226" x2="198" y2="252" />
        <line className="energyLink" x1="198" y1="252" x2="260" y2="226" />
        <line className="energyLink" x1="260" y1="226" x2="318" y2="252" />
        <line className="energyLink" x1="318" y1="252" x2="374" y2="238" />
        <line className="energyLink" x1="74" y1="248" x2="88" y2="318" />
        <line className="energyLink" x1="138" y1="226" x2="152" y2="300" />
        <line className="energyLink" x1="198" y1="252" x2="214" y2="324" />
        <line className="energyLink" x1="260" y1="226" x2="278" y2="304" />
        <line className="energyLink" x1="318" y1="252" x2="340" y2="322" />
        <line className="energyLink" x1="88" y1="318" x2="152" y2="300" />
        <line className="energyLink" x1="152" y1="300" x2="214" y2="324" />
        <line className="energyLink" x1="214" y1="324" x2="278" y2="304" />
        <line className="energyLink" x1="278" y1="304" x2="340" y2="322" />
        <circle className="networkNodeX teal" cx="48" cy="72" r="7" />
        <circle className="nodeEcho n00" cx="48" cy="72" r="10" />
        <circle className="networkNodeX orange" cx="102" cy="54" r="5" />
        <circle className="nodeEcho n01" cx="102" cy="54" r="13" />
        <circle className="networkNodeX lime" cx="154" cy="82" r="5" />
        <circle className="nodeEcho n02" cx="154" cy="82" r="16" />
        <circle className="networkNodeX teal" cx="214" cy="50" r="7" />
        <circle className="nodeEcho n03" cx="214" cy="50" r="19" />
        <circle className="networkNodeX orange" cx="276" cy="74" r="5" />
        <circle className="nodeEcho n04" cx="276" cy="74" r="10" />
        <circle className="networkNodeX lime" cx="348" cy="55" r="5" />
        <circle className="nodeEcho n05" cx="348" cy="55" r="13" />
        <circle className="networkNodeX teal" cx="382" cy="112" r="7" />
        <circle className="nodeEcho n06" cx="382" cy="112" r="16" />
        <circle className="networkNodeX orange" cx="68" cy="160" r="5" />
        <circle className="nodeEcho n07" cx="68" cy="160" r="19" />
        <circle className="networkNodeX teal" cx="124" cy="142" r="5" />
        <circle className="nodeEcho n08" cx="124" cy="142" r="10" />
        <circle className="networkNodeX orange" cx="188" cy="122" r="7" />
        <circle className="nodeEcho n09" cx="188" cy="122" r="13" />
        <circle className="networkNodeX lime" cx="244" cy="142" r="5" />
        <circle className="nodeEcho n10" cx="244" cy="142" r="16" />
        <circle className="networkNodeX teal" cx="304" cy="128" r="5" />
        <circle className="nodeEcho n11" cx="304" cy="128" r="19" />
        <circle className="networkNodeX orange" cx="356" cy="172" r="7" />
        <circle className="nodeEcho n12" cx="356" cy="172" r="10" />
        <circle className="networkNodeX lime" cx="74" cy="248" r="5" />
        <circle className="nodeEcho n13" cx="74" cy="248" r="13" />
        <circle className="networkNodeX teal" cx="138" cy="226" r="5" />
        <circle className="nodeEcho n14" cx="138" cy="226" r="16" />
        <circle className="networkNodeX orange" cx="198" cy="252" r="7" />
        <circle className="nodeEcho n15" cx="198" cy="252" r="19" />
        <circle className="networkNodeX teal" cx="260" cy="226" r="5" />
        <circle className="nodeEcho n16" cx="260" cy="226" r="10" />
        <circle className="networkNodeX lime" cx="318" cy="252" r="5" />
        <circle className="nodeEcho n17" cx="318" cy="252" r="13" />
        <circle className="networkNodeX orange" cx="374" cy="238" r="7" />
        <circle className="nodeEcho n18" cx="374" cy="238" r="16" />
        <circle className="networkNodeX teal" cx="88" cy="318" r="5" />
        <circle className="nodeEcho n19" cx="88" cy="318" r="19" />
        <circle className="networkNodeX orange" cx="152" cy="300" r="5" />
        <circle className="nodeEcho n20" cx="152" cy="300" r="10" />
        <circle className="networkNodeX lime" cx="214" cy="324" r="7" />
        <circle className="nodeEcho n21" cx="214" cy="324" r="13" />
        <circle className="networkNodeX teal" cx="278" cy="304" r="5" />
        <circle className="nodeEcho n22" cx="278" cy="304" r="16" />
        <circle className="networkNodeX orange" cx="340" cy="322" r="5" />
        <circle className="nodeEcho n23" cx="340" cy="322" r="19" />
        </g>

        <g className="networkPackets">
        <circle className="svgPacket teal" r="3.8">
          <animateMotion dur="4.20s" begin="-0.00s" repeatCount="indefinite" path="M48 72 L102 54 L154 82 L214 50 L276 74" />
        </circle>
        <circle className="svgPacket orange" r="3.8">
          <animateMotion dur="4.83s" begin="-0.77s" repeatCount="indefinite" path="M68 160 L124 142 L188 122 L244 142 L304 128" />
        </circle>
        <circle className="svgPacket teal" r="3.8">
          <animateMotion dur="5.46s" begin="-1.54s" repeatCount="indefinite" path="M74 248 L138 226 L198 252 L260 226 L318 252" />
        </circle>
        <circle className="svgPacket teal" r="3.8">
          <animateMotion dur="6.09s" begin="-2.31s" repeatCount="indefinite" path="M88 318 L152 300 L214 324 L278 304 L340 322" />
        </circle>
        <circle className="svgPacket orange" r="3.8">
          <animateMotion dur="6.72s" begin="-3.08s" repeatCount="indefinite" path="M102 54 L124 142 L138 226 L152 300" />
        </circle>
        <circle className="svgPacket teal" r="3.8">
          <animateMotion dur="7.35s" begin="-3.85s" repeatCount="indefinite" path="M214 50 L188 122 L198 252 L214 324" />
        </circle>
        <circle className="svgPacket teal" r="3.8">
          <animateMotion dur="7.98s" begin="-4.62s" repeatCount="indefinite" path="M348 55 L304 128 L318 252 L340 322" />
        </circle>
        </g>

        <circle className="coreHalo outer" cx="210" cy="154" r="58" />
        <circle className="coreHalo inner" cx="210" cy="154" r="38" />
        <circle className="coreAnchor" cx="210" cy="154" r="16" />
        <circle className="coreAnchorDot" cx="210" cy="154" r="5" />

        <path className="scanArc" d="M54 154 A156 156 0 0 1 366 154" />
        <path className="scanArc orange" d="M92 244 A124 124 0 0 0 328 244" />
      </svg>

      <div className="heroCore">
        <span className="heroCoreLetter">C</span>
        <span className="heroCoreLabel">Campus network</span>
      </div>

      <div className="heroDataRail" />
    </div>
  );
}

export default App;