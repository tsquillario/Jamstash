describe('issues', function() {
  it('formats `2011-09-29 14:50:49`', function() {
    // https://github.com/phstc/jquery-dateFormat/issues/19
    expect($.format.date('2011-09-29 14:50:49', 'MMM dd, yyyy')).toEqual('Sep 29, 2011');
  });

  it('formats `2011-04-25T09:04:14.7270000`', function() {
    // https://github.com/phstc/jquery-dateFormat/issues/17
    expect($.format.date('2011-04-25T09:04:14.7270000', 'yyyy-MM-dd HH:mm')).toEqual('2011-04-25 09:04');
  });

  it('formats `Wed Jan 09 06:23:38 PST 2012`', function() {
    // https://github.com/phstc/jquery-dateFormat/issues/24
    expect($.format.date('Wed Jan 09 06:23:38 PST 2012', '-')).toEqual('-');
    expect($.format.date('Wed Jan 09 06:23:38 PST 2012', 'd-')).toEqual('9-');
    expect($.format.date('Wed Jan 09 06:23:38 PST 2012', 'd/')).toEqual('9/');
  });

  it('formats `2012-02-07CET00:00:00`', function() {
    // https://github.com/phstc/jquery-dateFormat/pull/22
    expect($.format.date('2012-02-07CET00:00:00', 'dd/MM/yyyy')).toEqual('07/02/2012');
    expect($.format.date('2012-02-07CET00:00:00', 'MMM/yyyy')).toEqual('Feb/2012');
    expect($.format.date('2012-02-07CET00:00:00', 'MM')).toEqual('02');
    expect($.format.date('2012-02-07CET00:00:00', 'dd')).toEqual('07');
    expect($.format.date('2012-02-07CET00:00:00', 'yyyy')).toEqual('2012');
  });

  it('formats `946782123000`', function() {
    // https://github.com/phstc/jquery-dateFormat/pull/22
    var testDate = new Date('Jan 2, 2000 01:02:03');
    expect($.format.date(testDate.getTime(), 'MM')).toEqual('01');
    expect($.format.date(testDate.getTime(), 'd')).toEqual('2');
    expect($.format.date(testDate.getTime(), 'yyyy')).toEqual('2000');
    expect($.format.date(testDate.getTime(), 'HH')).toEqual('01');
    expect($.format.date(testDate.getTime(), 'mm')).toEqual('02');
    expect($.format.date(testDate.getTime(), 'ss')).toEqual('03');
  });

  it('formats `2009-04-19T16:11:05-02:00`', function() {
    // Reference: http://pablocantero.com/blog/2010/09/04/jquery-plugin-javascript-for-java-util-date-tostring-format/#comment-259520318
    expect($.format.date('2009-04-19T16:11:05-02:00', 'dd/MM/yyyy')).toEqual('19/04/2009');
    expect($.format.date('2009-04-19T16:11:05-02:00', 'MMM/yyyy')).toEqual('Apr/2009');
  });

  it('formats `Mon Mar 28 2011 17:45:00 GMT-0400 (Eastern Daylight Time)`', function() {
    // Reference: http://pablocantero.com/blog/2010/09/04/jquery-plugin-javascript-for-java-util-date-tostring-format/#comment-178490699
    expect($.format.date('Mon Mar 28 2011 17:45:00 GMT-0400 (Eastern Daylight Time)', 'hh:mma')).toEqual('05:45PM');
    expect($.format.date('Mon Mar 28 2011 17:45:00 GMT-0400 (Eastern Daylight Time)', 'hh:mmp')).toEqual('05:45p.m.');
  });

  it('formats `h:mm` `2012-02-07CET00:00:00`', function() {
    var testDate = new Date('Jan 2, 2000 00:00:00');
    expect($.format.date(testDate, 'h:mm')).toEqual('12:00');
  });
});

