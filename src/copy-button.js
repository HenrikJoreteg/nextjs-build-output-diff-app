import { h, Component } from "preact";

export class CopyButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      copying: false,
      copied: false,
      error: false,
    };
  }

  render({ text, ...rest }, { copying, copied, error }) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return null;
    }
    return (
      <button
        className="pa2"
        disabled={copying || copied || rest.disabled}
        onClick={() => {
          this.setState({ copying: true });
          navigator.clipboard
            .writeText(text)
            .then(() => {
              this.setState({ copying: false, copied: true });
              setTimeout(() => {
                this.setState({ copied: false, copying: false });
              }, 1000);
            })
            .catch(() => {
              this.setState({
                copying: false,
                copied: false,
                error: "failed to copy",
              });
            });
        }}
        {...rest}
      >
        {error && "Failed to copy, try again"}
        {!copying && !copied && "Copy to clipboard"}
        {copied && "Copied!"}
        {copying && "Copying..."}
      </button>
    );
  }
}
