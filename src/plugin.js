const Validator = require('amenov.frontend.validator')

function plugin(globalOptions = {}) {
  function initValidator({
    $this,
    request,
    rules,
    errors,
    options: localOptions = {}
  }) {
    // @NEW-VALIDATOR
    function newValidator(request, rules) {
      const validation = new Validator(
        request,
        rules,
        Object.keys(localOptions).length
          ? { ...globalOptions, ...localOptions }
          : globalOptions
      )

      validation.fails()

      return validation
    }

    // @RUN
    function run() {
      const validation = newValidator(request, rules)

      for (const key in errors) {
        if (Object.hasOwnProperty.call(errors, key)) {
          delete errors[key]
        }
      }

      if (validation.failed) {
        for (const key in validation.errors) {
          if (Object.hasOwnProperty.call(validation.errors, key)) {
            errors[key] = validation.errors[key]
          }
        }
      }

      $this.$forceUpdate()

      return validation.failed
    }

    // @ON-CHECK
    function onCheck(key) {
      if (!key) return

      const rulesValue = rules[key]

      if (rulesValue) {
        const validation = newValidator(request, {
          [key]: rulesValue
        })

        if (validation.failed) {
          errors[key] = validation.errors[key]
        } else {
          delete errors[key]
        }
      }

      $this.$forceUpdate()
    }

    // @HAS-ERROR
    function hasError(key) {
      return !!getError(key)
    }

    // @GET-ERROR
    function getError(key) {
      if (key) {
        return eval('errors.' + key.replaceAll('.', '?.'))
      }
    }

    // @RESET
    function reset() {
      for (const key in errors) {
        if (Object.hasOwnProperty.call(errors, key)) {
          delete errors[key]
        }
      }

      $this.$forceUpdate()
    }

    return { onCheck, hasError, getError, run, reset }
  }

  return {
    install(Vue) {
      Vue.prototype.$initValidator = initValidator
    }
  }
}

module.exports = plugin
