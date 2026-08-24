from __future__ import annotations

from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ComparisonStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    EXCLUDED = "EXCLUDED"


class Student(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    group_id: str = Field(min_length=1)


class PairAssignment(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    assignment_id: str
    criterion_id: str
    evaluator_id: str
    item_a_id: str
    item_b_id: str
    display_left_item_id: str
    generation: int = 1

    @model_validator(mode="after")
    def validate_pair(self) -> "PairAssignment":
        if self.item_a_id >= self.item_b_id:
            raise ValueError("item_a_id and item_b_id must be stored in canonical order")
        if self.display_left_item_id not in (self.item_a_id, self.item_b_id):
            raise ValueError("display_left_item_id must reference one item in the pair")
        return self


class FeasibilityResult(BaseModel):
    model_config = ConfigDict(frozen=True)

    target_coverage: int
    actual_coverage: int
    workload: int
    pair_count: int
    total_comparisons: int
    reduced: bool
    explanation: str


class IndividualFeasibility(BaseModel):
    model_config = ConfigDict(frozen=True)

    group_size: int
    enabled: bool
    pair_count: int
    workload: int
    min_coverage: int
    max_coverage: int
    low_confidence: bool
    workload_capped: bool


class WeightedPoint(BaseModel):
    model_config = ConfigDict(frozen=True)

    score: Decimal = Field(ge=Decimal("0"), le=Decimal("1"))
    evaluator_weight: Decimal = Field(ge=Decimal("0"))
    status: ComparisonStatus = ComparisonStatus.SUBMITTED


class CriterionScoreInput(BaseModel):
    model_config = ConfigDict(frozen=True)

    quality_index: Decimal = Field(ge=Decimal("0"), le=Decimal("1"))
    weight_pct: Decimal = Field(ge=Decimal("0"), le=Decimal("100"))
