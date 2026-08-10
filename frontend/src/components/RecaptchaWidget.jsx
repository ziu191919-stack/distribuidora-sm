import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";

const SITE_KEY = "6LfgmVItAAAAAIXtZACchsoNayORYgAjt4cHjFUM";

const RecaptchaWidget = forwardRef(function RecaptchaWidget({ onToken }, ref) {
  const contenedorRef = useRef(null);
  const widgetIdRef = useRef(null);

  useEffect(() => {
    function renderizarWidget() {
      if (window.grecaptcha && contenedorRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(contenedorRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
        });
      }
    }

    if (window.grecaptcha && window.grecaptcha.render) {
      renderizarWidget();
    } else {
      const intervalo = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          renderizarWidget();
          clearInterval(intervalo);
        }
      }, 300);
      return () => clearInterval(intervalo);
    }
  }, [onToken]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
        onToken("");
      }
    },
  }));

  return <div ref={contenedorRef}></div>;
});

export default RecaptchaWidget;