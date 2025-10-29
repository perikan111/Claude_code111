"""Main game loop for TRPG with Concordia."""

import sys
from typing import List, Dict, Any
from concordia.language_model import language_model

from agents.game_master import GameMaster
from agents.player import Player
from scenarios.fantasy_quest import get_example_scenario


class TRPGGame:
    """Main game coordinator for the TRPG."""

    def __init__(self, model: language_model.LanguageModel):
        """
        Initialize the game.

        Args:
            model: Language model for all agents
        """
        self.model = model
        self.gm: GameMaster = None
        self.players: List[Player] = []
        self.scenario = None
        self.turn_count = 0
        self.game_state = {
            "active": True,
            "current_location": "",
            "party_status": "healthy"
        }

    def setup_game(self):
        """Set up the game with scenario and characters."""
        print("=" * 60)
        print("TRPG with Google Concordia")
        print("=" * 60)
        print()

        # Load scenario
        self.scenario = get_example_scenario()
        print(f"Loading scenario: {self.scenario.name}")
        print()
        print(self.scenario.description)
        print()

        # Initialize Game Master
        self.gm = GameMaster(
            name="Game Master",
            model=self.model,
            scenario_description=self.scenario.description
        )

        # Create player characters
        self.create_default_party()

        # Set starting location
        self.game_state["current_location"] = self.scenario.starting_location

        print("=" * 60)
        print("Party Members:")
        print("=" * 60)
        for player in self.players:
            print(player.get_character_sheet())
        print()

    def create_default_party(self):
        """Create a default party of adventurers."""
        # Warrior character
        warrior = Player(
            name="Theron",
            model=self.model,
            character_class="Warrior",
            personality="Brave and protective, always ready to defend allies. Direct in speech.",
            goals=[
                "Protect the innocent",
                "Prove my strength and honor",
                "Find worthy challenges"
            ]
        )

        # Mage character
        mage = Player(
            name="Celeste",
            model=self.model,
            character_class="Mage",
            personality="Curious and analytical, seeks knowledge. Sometimes absent-minded.",
            goals=[
                "Uncover ancient magical secrets",
                "Study rare artifacts",
                "Master new spells"
            ]
        )

        # Rogue character
        rogue = Player(
            name="Raven",
            model=self.model,
            character_class="Rogue",
            personality="Witty and cautious, prefers stealth to direct confrontation.",
            goals=[
                "Acquire rare treasures",
                "Avoid unnecessary risks",
                "Uncover hidden secrets"
            ]
        )

        self.players = [warrior, mage, rogue]

    def run_game(self, max_turns: int = 20):
        """
        Run the main game loop.

        Args:
            max_turns: Maximum number of turns to run
        """
        # Opening scene
        print("=" * 60)
        print("GAME START")
        print("=" * 60)
        print()

        opening = self.scenario.get_starting_scene()
        print(opening)
        print()

        # Game loop
        while self.game_state["active"] and self.turn_count < max_turns:
            self.turn_count += 1
            print("=" * 60)
            print(f"TURN {self.turn_count}")
            print("=" * 60)
            print()

            # Each player takes an action
            for player in self.players:
                if not self.game_state["active"]:
                    break

                self.player_turn(player)
                print()

            # GM narrates what happens
            if self.game_state["active"]:
                self.gm_response()
                print()

            # Check for game end conditions
            self.check_game_state()

            # Short pause between turns (in real game, could wait for user input)
            if self.turn_count >= max_turns:
                print("=" * 60)
                print("GAME PAUSED - Turn limit reached")
                print("=" * 60)
                break

        self.end_game()

    def player_turn(self, player: Player):
        """
        Process a single player's turn.

        Args:
            player: The player taking their turn
        """
        print(f"--- {player.name}'s Turn ---")

        # Get current situation
        situation = self.get_current_situation()

        # Get available actions
        available_actions = self.gm.get_available_actions(situation)

        # Player decides action
        decision = player.decide_action(
            situation=situation,
            available_actions=available_actions,
            gm_context=f"Location: {self.game_state['current_location']}"
        )

        print(f"{player.name}: \"{decision['action']}\"")
        print(f"(Thinking: {decision['reasoning']})")

        # GM processes the action
        result = self.gm.process_action(
            player_name=player.name,
            action=decision['action'],
            game_context=self.game_state
        )

        print(f"\nGM: {result}")

        # Player reacts
        reaction = player.react_to_event(result)
        print(f"{player.name}: {reaction}")

    def gm_response(self):
        """GM narrates the overall situation."""
        print("--- GM Narration ---")

        context = f"The party is at {self.game_state['current_location']}. "
        context += f"Turn {self.turn_count} of their adventure."

        narration = self.gm.narrate_scene(context)
        print(narration)

    def get_current_situation(self) -> str:
        """Get description of the current situation."""
        situation = f"You are at {self.game_state['current_location']}. "

        if self.turn_count == 1:
            situation += "Elder Miriam has asked for your help investigating the temple."
        elif self.turn_count < 5:
            situation += "You are preparing to investigate the mysterious temple."
        elif self.turn_count < 10:
            situation += "You are exploring the Temple of Eldoria."
        else:
            situation += "You are deep within the temple, searching for the missing villagers."

        return situation

    def check_game_state(self):
        """Check if the game should end."""
        # In a full game, would check for victory/defeat conditions
        # For this demo, just continue until turn limit
        pass

    def end_game(self):
        """End the game and show summary."""
        print()
        print("=" * 60)
        print("GAME END")
        print("=" * 60)
        print()
        print("Thank you for playing!")
        print(f"Total turns: {self.turn_count}")
        print()
        print("Final party status:")
        for player in self.players:
            print(f"- {player.name} ({player.character_class}): "
                  f"Health {player.stats['health']}/100")


def create_language_model(api_key: str = None, model_type: str = "claude"):
    """
    Create a language model for the game.

    Args:
        api_key: API key for the model service
        model_type: Type of model to use ("claude" or "openai")

    Returns:
        LanguageModel instance
    """
    # This is a placeholder - in real implementation, would create actual
    # Concordia language model wrappers

    class MockLanguageModel(language_model.LanguageModel):
        """Mock language model for testing."""

        def sample_text(
            self,
            prompt: str,
            *,
            max_tokens: int = 1000,
            terminators: tuple[str] = (),
            temperature: float = 1.0,
            timeout: float = 30.0,
            seed: int = None
        ) -> str:
            """Return a mock response."""
            # In real implementation, this would call the actual API
            return "[Mock response - Please configure a real language model]"

        def sample_choice(
            self,
            prompt: str,
            responses: tuple[str],
            *,
            seed: int = None
        ) -> tuple[int, str, dict[str, float]]:
            """Return a mock choice."""
            return (0, responses[0], {responses[0]: 1.0})

    if api_key:
        # Would initialize real model here
        print(f"Initializing {model_type} model...")
        # return actual_model
        pass

    print("WARNING: Using mock language model. Set API_KEY to use real AI.")
    return MockLanguageModel()


def main():
    """Main entry point."""
    print("Initializing TRPG Game...")
    print()

    # Get API key from environment or user
    import os
    api_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY")

    # Create language model
    model = create_language_model(api_key)

    # Create and setup game
    game = TRPGGame(model)
    game.setup_game()

    # Run the game
    print("Starting game...")
    print()

    try:
        game.run_game(max_turns=10)  # Run for 10 turns as demo
    except KeyboardInterrupt:
        print("\n\nGame interrupted by user.")
        game.end_game()
    except Exception as e:
        print(f"\n\nError occurred: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
