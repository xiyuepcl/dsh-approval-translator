// dsh-translator — browser half is a deliberate NO-OP.
//
// Approval translation is implemented host-side (the node half prepends an
// `approval/request` waterfall listener that translates `req.reason` before
// the web answerer builds the client frame), so the dialog headline is
// rendered natively in Chinese by React. The earlier client-side approach
// (walking the DOM and swapping text nodes) was defeated by React re-renders
// restoring the original text, so no client UI is shipped.

window.__ModuleLoader__.load({
  id: 'dsh-translator',
  factory: (require) => {
    var module = { exports: {} }

    function apply() {
      // intentionally empty — all translation happens on the host side
    }

    module.exports.name = 'dsh-translator'
    module.exports.inject = []
    module.exports.apply = apply
    return module.exports
  },
})
