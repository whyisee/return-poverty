from app.schemas.game import EventCard, GameSession


def pick_event(session: GameSession, events: list[EventCard]) -> EventCard | None:
    phase_events = [event for event in events if event.phase == session.phase]
    if not phase_events:
        return None

    # Deterministic enough for MVP: same state produces same suggested event.
    index = (session.day + session.week + len(session.flags)) % len(phase_events)
    return phase_events[index]

