import React from 'react';
import { expect, test, describe } from "bun:test";
import { renderToString } from "react-dom/server";
import { FunctionVisualizer } from "./FunctionVisualizer";

describe("FunctionVisualizer", () => {
  test("renders default parabola_shift correctly", () => {
    const html = renderToString(<FunctionVisualizer />);
    expect(html).toContain("Graph Preview");
    expect(html).toContain("f(x) = x²");
    expect(html).toContain("g(x) = x² - 5");
    expect(html).toContain("<svg");
    expect(html).toContain("<path");
  });

  test("renders exp_growth correctly", () => {
    const html = renderToString(<FunctionVisualizer type="exp_growth" />);
    expect(html).toContain("f(x) = 2^x");
    expect(html).toContain("g(x) = 2^(x-1) - 4");
    expect(html).toContain("HA: y = -4");
    expect(html).toContain("<path");
  });

  test("renders exp_decay correctly", () => {
    const html = renderToString(<FunctionVisualizer type="exp_decay" />);
    expect(html).toContain("Decay Curve");
    expect(html).toContain("HA: y = 0");
    expect(html).toContain("<path");
  });

  test("renders log_curve correctly", () => {
    const html = renderToString(<FunctionVisualizer type="log_curve" />);
    expect(html).toContain("g(x) = log₂(x - 3) + 1");
    expect(html).toContain("VA: x = 3");
    expect(html).toContain("<path");
  });

  test("renders cubic_symm correctly", () => {
    const html = renderToString(<FunctionVisualizer type="cubic_symm" />);
    expect(html).toContain("Odd 180° Rotational Symmetry");
    expect(html).toContain("<path");
  });

  test("renders rational_curve correctly", () => {
    const html = renderToString(<FunctionVisualizer type="rational_curve" />);
    expect(html).toContain("f(x) = (2x + 1)/(x - 2)");
    expect(html).toContain("VA: x = 2");
    expect(html).toContain("<path");
  });

  test("renders custom title and color", () => {
    const html = renderToString(<FunctionVisualizer title="Custom Title" color="#123456" />);
    expect(html).toContain("Custom Title");
    // Verify the color is applied as a background color to the title span
    expect(html).toContain('background-color:#123456');
    // Verify the color is applied to the graph path
    expect(html).toContain('stroke="#123456"');
  });

  test("renders valid SVG structure", () => {
    const html = renderToString(<FunctionVisualizer type="parabola_shift" />);
    expect(html).toContain('viewBox="0 0 320 180"');
    expect(html).toContain('<line x1="0" y1="90" x2="320" y2="90"'); // x-axis
    expect(html).toContain('<line x1="160" y1="0" x2="160" y2="180"'); // y-axis
    expect(html).toContain('x'); // x label
    expect(html).toContain('y'); // y label
  });
});
