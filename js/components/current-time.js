(function () {
  function init() {
    var defaultTimezone = "Europe/Amsterdam";

    var formatNumber = function (number) {
      return number.toString().padStart(2, '0');
    };

    var createFormatter = function (timezone) {
      return new Intl.DateTimeFormat([], {
        timeZone: timezone,
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    };

    var parseFormattedTime = function (formattedDateTime) {
      var match = formattedDateTime.match(/(\d+):(\d+):(\d+)\s*([\w+]+)/);
      if (match) {
        return {
          hours: match[1],
          minutes: match[2],
          seconds: match[3],
          timezone: match[4],
        };
      }
      return null;
    };

    var updateTime = function () {
      document.querySelectorAll('[data-current-time]').forEach(function (element) {
        var timezone = element.getAttribute('data-current-time') || defaultTimezone;
        var formatter = createFormatter(timezone);
        var now = new Date();
        var formattedDateTime = formatter.format(now);

        var timeParts = parseFormattedTime(formattedDateTime);
        if (timeParts) {
          var hoursElem = element.querySelector('[data-current-time-hours]');
          var minutesElem = element.querySelector('[data-current-time-minutes]');
          var secondsElem = element.querySelector('[data-current-time-seconds]');
          var timezoneElem = element.querySelector('[data-current-time-timezone]');

          if (hoursElem) hoursElem.textContent = timeParts.hours;
          if (minutesElem) minutesElem.textContent = timeParts.minutes;
          if (secondsElem) secondsElem.textContent = timeParts.seconds;
          if (timezoneElem) timezoneElem.textContent = timeParts.timezone;
        }
      });
    };

    updateTime();
    setInterval(updateTime, 1000);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
