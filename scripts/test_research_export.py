"""Tests fail if export invents portfolio metrics or loses curve extremes."""
import importlib.util
from pathlib import Path
import sys

import pytest


def exporter():
    path = Path(__file__).with_name("research_export.py")
    assert path.exists(), "reproducible research exporter missing"
    spec = importlib.util.spec_from_file_location("research_export", path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_curve_starts_at_100_and_preserves_worst_drawdown():
    m = exporter()
    points = m.chart_points(["a", "b", "c", "d"], [100., 200., 50., 150.], stride=4)
    assert points[0] == ["a", 100., 0.]
    assert ["c", 50., -75.] in points
    assert points[-1] == ["d", 150., -25.]


def test_undefined_measure_is_null_not_zero_or_infinity():
    m = exporter()
    assert m.finite(float("inf")) is None
    assert m.finite(float("nan")) is None
    assert m.finite(-0.5) == -0.5


def test_correlation_refuses_mismatched_timestamps():
    m = exporter()
    with pytest.raises(ValueError, match="timestamps"):
        m.return_correlation(["a", "b", "c"], [1., 2., 1.], ["a", "c", "d"], [1., 2., 1.])
