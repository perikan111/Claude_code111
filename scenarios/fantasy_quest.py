"""Fantasy quest scenario for TRPG."""

from typing import Dict, List, Any


class FantasyQuestScenario:
    """A classic fantasy adventure scenario."""

    def __init__(self):
        """Initialize the fantasy quest scenario."""
        self.name = "The Lost Temple of Eldoria"
        self.description = self.get_description()
        self.starting_location = "Village of Millbrook"
        self.key_locations = self.get_key_locations()
        self.npcs = self.get_npcs()
        self.quests = self.get_quests()

    def get_description(self) -> str:
        """Get the scenario description."""
        return """
The peaceful village of Millbrook has been plagued by mysterious disappearances.
Local farmers report strange lights near the old ruins of the Temple of Eldoria,
an ancient structure dedicated to a forgotten goddess of wisdom.

Legends speak of a powerful artifact hidden within the temple - the Orb of Insight,
which grants its holder great knowledge and foresight. However, the temple has been
sealed for centuries, and dark forces are said to guard its secrets.

The village elder has called for brave adventurers to investigate the temple,
rescue any missing villagers, and uncover the truth behind these strange events.
"""

    def get_starting_scene(self) -> str:
        """Get the opening scene description."""
        return """
You find yourselves in the village square of Millbrook, a small farming community
nestled at the edge of the Whisperwood Forest. The sun is setting, casting long
shadows across the cobblestone streets. Worried villagers huddle in small groups,
speaking in hushed tones about the recent disappearances.

An elderly woman with silver hair and kind eyes approaches your party. She introduces
herself as Elder Miriam, the village leader.

"Thank the gods you've come," she says, her voice trembling slightly. "Five of our
people have vanished in the past week, all near the old temple ruins. We dare not
venture there ourselves. Will you help us?"

She gestures toward the darkening forest to the east, where ancient stone
structures can barely be seen through the trees.
"""

    def get_key_locations(self) -> Dict[str, str]:
        """Get important locations in the scenario."""
        return {
            "Village of Millbrook": "A peaceful farming village with about 200 residents.",
            "Whisperwood Forest": "A dense forest with ancient trees. Local legends say it's enchanted.",
            "Temple of Eldoria - Entrance": "Massive stone doors covered in mystical runes.",
            "Temple of Eldoria - Main Hall": "A vast chamber with pillars depicting ancient history.",
            "Temple of Eldoria - Inner Sanctum": "The heart of the temple, where the Orb is kept.",
            "Underground Chambers": "Dark passages beneath the temple, filled with traps.",
        }

    def get_npcs(self) -> Dict[str, Dict[str, str]]:
        """Get NPCs in the scenario."""
        return {
            "Elder Miriam": {
                "role": "Village Elder",
                "personality": "Wise, caring, worried about her people",
                "info": "She knows the history of the temple and can provide guidance."
            },
            "Marcus the Blacksmith": {
                "role": "Village Blacksmith",
                "personality": "Strong, straightforward, protective",
                "info": "His daughter was one of those who disappeared. Desperately wants help."
            },
            "Lyra the Herbalist": {
                "role": "Village Healer",
                "personality": "Knowledgeable, mystical, cautious",
                "info": "She has potions that might help. Senses dark magic at work."
            },
            "Shadow Cultist": {
                "role": "Temple Guardian",
                "personality": "Fanatical, secretive, dangerous",
                "info": "Member of a cult trying to use the Orb for their own purposes."
            },
            "Spirit of the Temple": {
                "role": "Ancient Guardian",
                "personality": "Ethereal, cryptic, protective of the temple",
                "info": "Can provide clues about the temple's secrets and history."
            }
        }

    def get_quests(self) -> List[Dict[str, Any]]:
        """Get quests available in the scenario."""
        return [
            {
                "name": "Find the Missing Villagers",
                "description": "Locate and rescue the five missing villagers",
                "objectives": [
                    "Investigate the temple ruins",
                    "Find clues about the disappearances",
                    "Locate the missing people",
                    "Safely return them to the village"
                ],
                "rewards": ["Gold", "Village gratitude", "Information about the temple"]
            },
            {
                "name": "Uncover the Temple's Secrets",
                "description": "Discover what lies within the Temple of Eldoria",
                "objectives": [
                    "Enter the sealed temple",
                    "Navigate the temple's traps and guardians",
                    "Find the Inner Sanctum",
                    "Learn the truth about the Orb of Insight"
                ],
                "rewards": ["Ancient knowledge", "Magical items", "Orb of Insight"]
            },
            {
                "name": "Stop the Shadow Cult",
                "description": "Prevent the cultists from misusing the Orb",
                "objectives": [
                    "Discover the cult's plans",
                    "Confront the cult leader",
                    "Protect the Orb from falling into wrong hands",
                    "Decide the fate of the Orb"
                ],
                "rewards": ["Hero status", "Powerful artifacts", "Temple's blessing"]
            }
        ]

    def get_initial_challenges(self) -> List[str]:
        """Get initial challenges players might face."""
        return [
            "Gaining the trust of worried villagers",
            "Finding the entrance to the sealed temple",
            "Deciphering ancient runes on the temple doors",
            "Dealing with forest creatures on the way to the temple",
            "Choosing whether to help individual villagers before the main quest"
        ]

    def get_scene_descriptions(self) -> Dict[str, str]:
        """Get detailed scene descriptions for key moments."""
        return {
            "temple_entrance": """
As you push through the last of the forest undergrowth, the Temple of Eldoria
stands before you in all its ancient glory. The structure is massive, built
from dark stone that seems to absorb the fading light. Intricate carvings
cover every surface - depicting scenes of worship, celestial events, and
mysterious rituals.

The main entrance consists of two enormous doors, each twenty feet tall,
covered in glowing blue runes that pulse with a faint magical energy.
Strange symbols form a complex pattern across the doorway. To either side,
weathered statues of robed figures stand as eternal sentinels.

The air here feels heavy with age and magic. You hear faint whispers on
the wind, though no one is around. Footprints in the dirt lead up to the
doors - fresh ones, made within the last few days.
""",
            "main_hall": """
The doors grind open with a sound like grinding stone, and you step into
the temple's main hall. Your torches cast flickering shadows on walls
lined with massive pillars, each carved with scenes from ancient history.

The hall extends far ahead, disappearing into darkness. The ceiling is
lost in shadow above you. Along the walls, alcoves contain statues of
forgotten deities, their stone eyes seeming to follow your movement.

In the center of the room, a circular pattern is etched into the floor,
with symbols matching those on the entrance doors. Several passages
branch off from the main hall, each leading deeper into the temple.

You hear sounds echoing from the depths - distant chanting, and perhaps...
voices calling for help?
""",
            "inner_sanctum": """
You finally reach the heart of the temple - the Inner Sanctum. The room
is circular, with a domed ceiling painted with constellations. In the
center, on a raised pedestal, floats the Orb of Insight.

The Orb is a perfect sphere of crystal, glowing with inner light that
shifts through colors - blue, purple, silver. Gazing at it, you feel
your mind expanding, glimpsing possibilities and knowledge beyond
normal understanding.

But you're not alone. Around the Orb, the missing villagers sit in a
trance, their eyes reflecting the Orb's light. And standing before them,
robed figures chant in an ancient language, their hands raised toward
the artifact.

A voice echoes through the chamber: "At last, the Orb's power will be
ours. And you, foolish adventurers, have arrived just in time to witness
our ascension..."
"""
        }


def get_example_scenario() -> FantasyQuestScenario:
    """Get an instance of the example scenario."""
    return FantasyQuestScenario()
