// -----------------------------------------
// CURRENT TIME — Live clock display
// -----------------------------------------

let intervals = [];

export function initCurrentTime(scope) {
  scope = scope || document;

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

  var elements = scope.querySelectorAll('[data-current-time]');
  if (!elements.length) return;

  var updateTime = function () {
    elements.forEach(function (element) {
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
  var id = setInterval(updateTime, 1000);
  intervals.push(id);
}

export function destroyCurrentTime() {
  intervals.forEach(function (id) {
    clearInterval(id);
  });
  intervals = [];
}
