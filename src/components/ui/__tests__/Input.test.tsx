import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@/test-utils";
import { Input, TextArea, SelectField } from "../Input";

describe("Input", () => {
  it("renders with a label", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows helper text", () => {
    render(<Input label="Email" helperText="We'll never share your email" />);
    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it("shows error message instead of helper text", () => {
    render(
      <Input label="Email" helperText="Helper" error="Required field" />,
    );
    expect(screen.getByText("Required field")).toBeInTheDocument();
    expect(screen.queryByText("Helper")).not.toBeInTheDocument();
  });

  it("renders leading icon", () => {
    render(<Input label="Search" leadingIcon={<span data-testid="lead-icon">🔍</span>} />);
    expect(screen.getByTestId("lead-icon")).toBeInTheDocument();
  });

  it("renders trailing icon", () => {
    render(<Input label="Password" trailingIcon={<span data-testid="trail-icon">👁</span>} />);
    expect(screen.getByTestId("trail-icon")).toBeInTheDocument();
  });

  it("applies disabled attribute", () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText("Name")).toBeDisabled();
  });

  it("applies aria-invalid when error is present", () => {
    render(<Input label="Name" error="Too short" />);
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards ref to input element", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText("Name"), "Hi");
    expect(onChange).toHaveBeenCalled();
  });

  it("sets aria-describedby to error ID when error present", () => {
    render(<Input label="Name" error="Required" />);
    const input = screen.getByLabelText("Name");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
  });
});

describe("TextArea", () => {
  it("renders with a label", () => {
    render(<TextArea label="Bio" />);
    expect(screen.getByLabelText("Bio")).toBeInTheDocument();
  });

  it("renders as textarea element", () => {
    render(<TextArea label="Bio" />);
    expect(screen.getByLabelText("Bio").tagName).toBe("TEXTAREA");
  });

  it("shows error message", () => {
    render(<TextArea label="Bio" error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });

  it("shows helper text when no error", () => {
    render(<TextArea label="Bio" helperText="Max 500 chars" />);
    expect(screen.getByText("Max 500 chars")).toBeInTheDocument();
  });

  it("applies disabled attribute", () => {
    render(<TextArea label="Bio" disabled />);
    expect(screen.getByLabelText("Bio")).toBeDisabled();
  });
});

describe("SelectField", () => {
  const options = [
    { value: "a", label: "Option A" },
    { value: "b", label: "Option B" },
  ];

  it("renders with a label", () => {
    render(<SelectField label="Pick one" options={options} />);
    expect(screen.getByLabelText("Pick one")).toBeInTheDocument();
  });

  it("renders all options", () => {
    render(<SelectField label="Pick one" options={options} />);
    expect(screen.getByText("Option A")).toBeInTheDocument();
    expect(screen.getByText("Option B")).toBeInTheDocument();
  });

  it("renders placeholder as disabled option", () => {
    render(<SelectField label="Pick one" options={options} placeholder="Choose..." />);
    const placeholder = screen.getByText("Choose...");
    expect(placeholder).toBeInTheDocument();
    expect((placeholder as HTMLOptionElement).disabled).toBe(true);
  });

  it("shows error message", () => {
    render(<SelectField label="Pick one" options={options} error="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("applies aria-invalid when error present", () => {
    render(<SelectField label="Pick one" options={options} error="Required" />);
    expect(screen.getByLabelText("Pick one")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
