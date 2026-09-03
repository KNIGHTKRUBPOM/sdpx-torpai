from __future__ import annotations

import os

import pytest

from src.services.pairing_service import PairingService
from tests.factories import make_classroom_students
from tests.fakes.fake_pair_assignment_repo import FakePairAssignmentRepository


# Set before tests import `main`, so API integration tests never write fixtures
# into the developer's persistent local demo database.
os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"


@pytest.fixture
def fake_pair_repo() -> FakePairAssignmentRepository:
    return FakePairAssignmentRepository()


@pytest.fixture
def pairing_service(fake_pair_repo: FakePairAssignmentRepository) -> PairingService:
    return PairingService(fake_pair_repo)


@pytest.fixture
def three_groups_of_four():
    return make_classroom_students((4, 4, 4))


@pytest.fixture
def four_groups_of_four():
    return make_classroom_students((4, 4, 4, 4))
