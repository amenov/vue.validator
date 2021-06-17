const Validator = require('amenov.frontend.validator')
const flat = require('flat')

function plugin(globalOptions = {}) {
  function initValidator({
    $this,
    request,
    rules,
    errors = {},
    options: localOptions = {}
  }) {
    // @NEW-VALIDATOR
    function newValidator(request, rules) {
      const validation = new Validator(
        request,
        JSON.parse(JSON.stringify(rules)),
        Object.keys(localOptions).length
          ? Object.assign(globalOptions, localOptions)
          : globalOptions
      )

      validation.fails()

      return validation
    }

    // @RUN
    function run() {
      const validation = newValidator(request, rules)

      clearErrors()

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

    // @CHECK
    function check(flatKey, index) {
      if (!flatKey) return

      const _flatRules = {}
      const _flatRequest = {}

      const flatRulesEntries = Object.entries(flat(rules))

      for (const [key, val] of flatRulesEntries) {
        if (key !== flatKey) continue

        if (key.includes('$')) {
          let stop

          const flatRulesKey = key
            .split('.')
            .filter((k) => {
              if (!stop) {
                if (k.startsWith('$')) stop = true

                return true
              }
            })
            .join('.')
            .replace('$', '')

          for (const [key, val] of flatRulesEntries) {
            if (flatRulesKey !== key) continue

            _flatRules[flatRulesKey] = val

            break
          }

          const flatRequestKey = key
            .split('.')
            .map((k) => (k.startsWith('$') ? k.slice(1) + `.${index}` : k))
            .join('.')

          for (const [key, val] of Object.entries(flat(request))) {
            if (flatRequestKey !== key) continue

            _flatRequest[flatRequestKey] = val

            break
          }
        }

        _flatRules[key] = val

        break
      }

      !Object.keys(_flatRequest).length &&
        Object.assign(_flatRequest, flat(request))

      const validation = newValidator(
        flat.unflatten(_flatRequest),
        flat.unflatten(_flatRules)
      )

      const flatErrors = flat(errors)

      if (validation.failed) {
        const flatValidationErrors = flat(validation.errors)

        clearErrors()

        Object.assign(
          errors,
          flat.unflatten(Object.assign(flatErrors, flatValidationErrors))
        )
      } else {
        const flatErrorsKey = flatKey
          .split('.')
          .map((k) =>
            k.startsWith('$')
              ? k.slice(1) + (index === 0 || index ? `.${index}` : '')
              : k
          )
          .join('.')

        for (const key in flatErrors) {
          if (
            Object.hasOwnProperty.call(flatErrors, key) &&
            key === flatErrorsKey
          ) {
            delete flatErrors[key]
          }
        }

        clearErrors()

        Object.assign(errors, flat.unflatten(flatErrors))
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
        return eval(
          'errors.' + key.replaceAll('.', '?.').replaceAll('[', '?.[')
        )
      }
    }

    // @CLEAR-ERRORS
    function clearErrors() {
      for (const key in errors) {
        if (Object.hasOwnProperty.call(errors, key)) {
          delete errors[key]
        }
      }
    }

    // @RESET
    function reset() {
      clearErrors()

      $this.$forceUpdate()
    }

    return {
      check,
      hasError,
      getError,
      run,
      reset
    }
  }

  return {
    install(Vue) {
      Vue.prototype.$initValidator = initValidator
    }
  }
}

module.exports = plugin
