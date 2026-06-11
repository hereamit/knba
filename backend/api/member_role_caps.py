"""Server-side mirror of frontend `lib/member-roles.ts`.

Defines the maximum number of MemberProfile records (per current committee
term) allowed for each role. Used to reject duplicate/over-capacity public
submissions and approval attempts.
"""

from typing import Optional


MEMBER_ROLE_CAPS: dict[str, dict[str, object]] = {
    "President": {"category": "leadership", "max_count": 1},
    "Founding President": {"category": "leadership", "max_count": 1},
    "Immediate Past President": {"category": "leadership", "max_count": 1},
    "Past President": {"category": "leadership", "max_count": 1},
    "Senior Vice President": {"category": "leadership", "max_count": 1},
    "First Vice President": {"category": "leadership", "max_count": 1},
    "Second Vice President": {"category": "leadership", "max_count": 1},
    "General Secretary": {"category": "leadership", "max_count": 1},
    "Secretary": {"category": "leadership", "max_count": 1},
    "Treasurer": {"category": "leadership", "max_count": 1},
    "Joint Treasurer": {"category": "leadership", "max_count": 1},
    "Executive Committee Member": {"category": "executive", "max_count": 14},
    "Advisor": {"category": "advisory", "max_count": 12},
    "Legal Advisor": {"category": "advisory", "max_count": 1},
}


def get_role_cap(role: str) -> Optional[dict[str, object]]:
    """Return the cap definition for a known role, or None for custom roles."""
    if not role:
        return None
    normalized = role.strip()
    if normalized in MEMBER_ROLE_CAPS:
        return MEMBER_ROLE_CAPS[normalized]
    lowered = normalized.lower()
    for key, value in MEMBER_ROLE_CAPS.items():
        if key.lower() == lowered:
            return value
    return None


def role_full_message(role: str, max_count: int) -> str:
    if max_count == 1:
        return (
            f'The position "{role}" is already filled for the current committee term. '
            "Only one member can hold this role at a time."
        )
    return (
        f'The "{role}" section is full for the current committee term '
        f"(maximum {max_count} members). No more submissions can be accepted."
    )
