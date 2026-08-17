# Changelog

## v0.1.0

- Host-side approval translation: an approval/request waterfall listener (prepended) translates req.reason to Simplified Chinese before the web answerer builds the client frame.
- The durable audit log keeps the original reason; translation failures never block an approval.
