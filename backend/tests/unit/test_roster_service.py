import pytest

from src.services.roster_service import RosterValidationError, normalize_email, parse_roster_csv


def test_normalize_email_removes_case_plus_tag_and_gmail_dots():
    assert normalize_email(" Some.One+lab@Gmail.com ") == "someone@gmail.com"
    assert normalize_email("Student.Name+lab@uni.ac.th") == "student.name@uni.ac.th"


def test_valid_roster_parses_optional_fields():
    rows = parse_roster_csv(
        "email,group_name,student_id,display_name,artifact_url\n"
        "a1@uni.ac.th,Alpha,1,A One,https://example.com/a\n"
        "a2@uni.ac.th,Alpha,2,A Two,https://example.com/a\n"
        "b1@uni.ac.th,Beta,3,B One,https://example.com/b\n"
        "b2@uni.ac.th,Beta,4,B Two,https://example.com/b\n"
    )
    assert len(rows) == 4
    assert rows[0].group_name == "Alpha"
    assert rows[0].artifact_url == "https://example.com/a"


def test_invalid_row_rejects_entire_roster_with_row_numbers():
    with pytest.raises(RosterValidationError) as captured:
        parse_roster_csv(
            "email,group_name\n"
            "bad-email,Alpha\n"
            "only@uni.ac.th,Beta\n"
        )
    errors = captured.value.errors
    assert any(error["row"] == 2 and error["field"] == "email" for error in errors)
    assert any("minimum is 2" in str(error["message"]) for error in errors)


def test_roster_rejects_spreadsheet_formula_injection():
    with pytest.raises(RosterValidationError) as captured:
        parse_roster_csv(
            "email,group_name,display_name\n"
            "a1@uni.ac.th,Alpha,=HYPERLINK(\"https://evil.example\")\n"
            "a2@uni.ac.th,Alpha,A Two\n"
        )
    assert any(error["field"] == "display_name" and "formula" in str(error["message"]).lower() for error in captured.value.errors)
