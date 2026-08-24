from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from itertools import combinations
from math import ceil, comb
from random import Random
from uuid import NAMESPACE_URL, uuid5

from src.domain.models import (
    FeasibilityResult,
    IndividualFeasibility,
    PairAssignment,
    Student,
)
from src.repositories.pair_assignment_repository import PairAssignmentRepository


class PairingNotFeasibleError(ValueError):
    pass


@dataclass
class _FlowEdge:
    target: int
    reverse_index: int
    capacity: int


class _FlowNetwork:
    def __init__(self, node_count: int) -> None:
        self.graph: list[list[_FlowEdge]] = [[] for _ in range(node_count)]

    def add_edge(self, source: int, target: int, capacity: int) -> _FlowEdge:
        forward = _FlowEdge(target, len(self.graph[target]), capacity)
        reverse = _FlowEdge(source, len(self.graph[source]), 0)
        self.graph[source].append(forward)
        self.graph[target].append(reverse)
        return forward

    def max_flow(self, source: int, sink: int) -> int:
        total = 0
        while True:
            levels = [-1] * len(self.graph)
            levels[source] = 0
            queue = [source]
            for node in queue:
                for edge in self.graph[node]:
                    if edge.capacity > 0 and levels[edge.target] < 0:
                        levels[edge.target] = levels[node] + 1
                        queue.append(edge.target)
            if levels[sink] < 0:
                return total

            cursors = [0] * len(self.graph)

            def send(node: int, amount: int) -> int:
                if node == sink:
                    return amount
                while cursors[node] < len(self.graph[node]):
                    edge = self.graph[node][cursors[node]]
                    if edge.capacity > 0 and levels[node] + 1 == levels[edge.target]:
                        pushed = send(edge.target, min(amount, edge.capacity))
                        if pushed:
                            edge.capacity -= pushed
                            reverse = self.graph[edge.target][edge.reverse_index]
                            reverse.capacity += pushed
                            return pushed
                    cursors[node] += 1
                return 0

            while (pushed := send(source, 10**9)) > 0:
                total += pushed


class PairingService:
    def __init__(self, repository: PairAssignmentRepository) -> None:
        self.repository = repository

    @staticmethod
    def _group_members(students: list[Student]) -> dict[str, list[Student]]:
        if len({student.id for student in students}) != len(students):
            raise ValueError("student ids must be unique")
        groups: dict[str, list[Student]] = defaultdict(list)
        for student in students:
            groups[student.group_id].append(student)
        return dict(groups)

    def solve_group_feasibility(
        self,
        students: list[Student],
        target_coverage: int = 5,
        max_workload: int = 8,
    ) -> FeasibilityResult:
        if target_coverage < 1 or max_workload < 1:
            raise ValueError("coverage and workload limits must be positive")

        groups = self._group_members(students)
        group_ids = sorted(groups)
        student_count = len(students)
        group_count = len(group_ids)
        if group_count < 3:
            raise PairingNotFeasibleError(
                "Group evaluation needs at least three groups because nobody may evaluate a pair containing their own group."
            )

        pairs = list(combinations(group_ids, 2))
        pair_count = len(pairs)
        eligible_per_pair = {
            pair: student_count - len(groups[pair[0]]) - len(groups[pair[1]])
            for pair in pairs
        }
        maximum_pairs_per_evaluator = pair_count - (group_count - 1)

        for coverage in range(target_coverage, 0, -1):
            total = pair_count * coverage
            workload = ceil(total / student_count)
            if workload > maximum_pairs_per_evaluator:
                continue
            if workload > max_workload:
                continue
            if any(coverage > eligible for eligible in eligible_per_pair.values()):
                continue

            reduced = coverage != target_coverage
            minimum_eligible = min(eligible_per_pair.values())
            if reduced:
                explanation = (
                    f"ลด coverage จาก {target_coverage} เป็น {coverage} ครั้งต่อคู่: "
                    f"คู่ที่จำกัดที่สุดมีผู้ประเมินที่มีสิทธิ์ {minimum_eligible} คน "
                    f"และนักศึกษาแต่ละคนรับได้ {workload} คู่ต่อเกณฑ์"
                )
            else:
                explanation = (
                    f"coverage {coverage} ครั้งต่อคู่ทำได้ โดยนักศึกษาแต่ละคนรับไม่เกิน "
                    f"{workload} คู่ต่อเกณฑ์"
                )
            return FeasibilityResult(
                target_coverage=target_coverage,
                actual_coverage=coverage,
                workload=workload,
                pair_count=pair_count,
                total_comparisons=total,
                reduced=reduced,
                explanation=explanation,
            )

        raise PairingNotFeasibleError(
            "No positive coverage satisfies self-group exclusion and workload constraints."
        )

    @staticmethod
    def solve_individual_feasibility(
        group_size: int,
        max_workload: int = 8,
    ) -> IndividualFeasibility:
        if group_size < 0 or max_workload < 1:
            raise ValueError("group size cannot be negative and max workload must be positive")
        if group_size <= 2:
            return IndividualFeasibility(
                group_size=group_size,
                enabled=False,
                pair_count=comb(group_size, 2) if group_size >= 2 else 0,
                workload=0,
                min_coverage=0,
                max_coverage=0,
                low_confidence=True,
                workload_capped=False,
            )

        pair_count = comb(group_size, 2)
        complete_workload = comb(group_size - 1, 2)
        workload = min(complete_workload, max_workload)
        total_assignments = group_size * workload
        min_coverage = total_assignments // pair_count
        max_coverage = ceil(total_assignments / pair_count)
        return IndividualFeasibility(
            group_size=group_size,
            enabled=True,
            pair_count=pair_count,
            workload=workload,
            min_coverage=min_coverage,
            max_coverage=max_coverage,
            low_confidence=group_size == 3,
            workload_capped=workload < complete_workload,
        )

    def generate_group_pairs(
        self,
        assignment_id: str,
        criterion_id: str,
        students: list[Student],
        seed: int,
        target_coverage: int = 5,
        max_workload: int = 8,
        generation: int = 1,
    ) -> tuple[FeasibilityResult, list[PairAssignment]]:
        feasibility = self.solve_group_feasibility(
            students,
            target_coverage=target_coverage,
            max_workload=max_workload,
        )
        groups = self._group_members(students)
        pairs = list(combinations(sorted(groups), 2))
        total = feasibility.total_comparisons
        base_load, extra_count = divmod(total, len(students))
        ordered_students = sorted(students, key=lambda student: student.id)

        selected: list[tuple[Student, tuple[str, str]]] | None = None
        for attempt in range(128):
            rng = Random(f"{seed}:{assignment_id}:{criterion_id}:{attempt}")
            extra_students = ordered_students.copy()
            rng.shuffle(extra_students)
            extra_ids = {student.id for student in extra_students[:extra_count]}
            selected = self._flow_allocate(
                ordered_students,
                pairs,
                coverage=feasibility.actual_coverage,
                load_by_student={
                    student.id: base_load + int(student.id in extra_ids)
                    for student in ordered_students
                },
                rng=rng,
            )
            if selected is not None:
                display_rng = Random(f"display:{seed}:{assignment_id}:{criterion_id}")
                assignments = [
                    PairAssignment(
                        id=str(
                            uuid5(
                                NAMESPACE_URL,
                                ":".join(
                                    (
                                        assignment_id,
                                        criterion_id,
                                        student.id,
                                        pair[0],
                                        pair[1],
                                        str(generation),
                                    )
                                ),
                            )
                        ),
                        assignment_id=assignment_id,
                        criterion_id=criterion_id,
                        evaluator_id=student.id,
                        item_a_id=pair[0],
                        item_b_id=pair[1],
                        display_left_item_id=pair[display_rng.randrange(2)],
                        generation=generation,
                    )
                    for student, pair in sorted(
                        selected,
                        key=lambda value: (value[0].id, value[1][0], value[1][1]),
                    )
                ]
                self.repository.replace_for_criterion(
                    assignment_id,
                    criterion_id,
                    assignments,
                )
                return feasibility, assignments

        raise PairingNotFeasibleError(
            "Feasibility constraints passed, but no balanced evaluator allocation was found."
        )

    @staticmethod
    def _flow_allocate(
        students: list[Student],
        pairs: list[tuple[str, str]],
        coverage: int,
        load_by_student: dict[str, int],
        rng: Random,
    ) -> list[tuple[Student, tuple[str, str]]] | None:
        shuffled_students = students.copy()
        shuffled_pairs = pairs.copy()
        rng.shuffle(shuffled_students)
        rng.shuffle(shuffled_pairs)

        source = 0
        student_offset = 1
        pair_offset = student_offset + len(shuffled_students)
        sink = pair_offset + len(shuffled_pairs)
        network = _FlowNetwork(sink + 1)

        for index, student in enumerate(shuffled_students):
            network.add_edge(source, student_offset + index, load_by_student[student.id])
        for index in range(len(shuffled_pairs)):
            network.add_edge(pair_offset + index, sink, coverage)

        assignment_edges: list[tuple[Student, tuple[str, str], _FlowEdge]] = []
        for student_index, student in enumerate(shuffled_students):
            eligible = [pair for pair in shuffled_pairs if student.group_id not in pair]
            rng.shuffle(eligible)
            pair_indexes = {pair: index for index, pair in enumerate(shuffled_pairs)}
            for pair in eligible:
                pair_index = pair_indexes[pair]
                edge = network.add_edge(
                    student_offset + student_index,
                    pair_offset + pair_index,
                    1,
                )
                assignment_edges.append((student, pair, edge))

        expected = len(pairs) * coverage
        if network.max_flow(source, sink) != expected:
            return None
        return [
            (student, pair)
            for student, pair, edge in assignment_edges
            if edge.capacity == 0
        ]
