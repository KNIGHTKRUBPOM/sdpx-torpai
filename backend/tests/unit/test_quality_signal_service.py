from src.services.quality_signal_service import QualitySignalService


def test_kendalls_w_is_one_for_identical_rankings():
    ratings = [
        {"a": 1.0, "b": 2.0, "c": 3.0},
        {"a": 2.0, "b": 4.0, "c": 6.0},
        {"a": 0.1, "b": 0.5, "c": 0.9},
    ]
    assert QualitySignalService.kendalls_w(ratings) == 1.0


def test_kendalls_w_detects_low_rater_agreement():
    ratings = [
        {"a": 3.0, "b": 2.0, "c": 1.0},
        {"a": 1.0, "b": 3.0, "c": 2.0},
        {"a": 2.0, "b": 1.0, "c": 3.0},
    ]
    assert QualitySignalService.kendalls_w(ratings) == 0.0


def test_kendalls_w_requires_two_raters_and_three_shared_items():
    assert QualitySignalService.kendalls_w([{"a": 1.0, "b": 2.0, "c": 3.0}]) is None
    assert QualitySignalService.kendalls_w([{"a": 1.0, "b": 2.0}, {"a": 2.0, "b": 1.0}]) is None
