/**
 * Add to the existing signing Apps Script. Call gripOnSigned(...) where the
 * signature is recorded, and gripOnGoal(...) where the goal appendix is saved.
 *
 * Script properties (Project settings → Script properties):
 *   GRIP_URL            https://<your-site>.netlify.app
 *   GRIP_INTAKE_SECRET  same value as INTAKE_SECRET on Netlify
 */
function gripPost_(path, payload) {
  var props = PropertiesService.getScriptProperties()
  var res = UrlFetchApp.fetch(props.getProperty('GRIP_URL') + path, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + props.getProperty('GRIP_INTAKE_SECRET') },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  })
  var code = res.getResponseCode()
  if (code >= 300) console.error('grip ' + path + ' → ' + code + ': ' + res.getContentText())
  return code
}

/** A client signed → participant. startDate optional ('yyyy-MM-dd'); defaults to today in Israel. */
function gripOnSigned(fullName, phone, email, startDate, price) {
  return gripPost_('/api/intake/signup', { full_name: fullName, phone: phone, email: email || null, start_date: startDate || null, price: price || null })
}

/** Goal appendix → goal + opening measurements. goalType: weight | body_fat | measurements | attendance | other */
function gripOnGoal(phone, goalType, goalText, goalValue, startWeight, startBodyFat, startMeasurements) {
  return gripPost_('/api/intake/goal', {
    phone: phone, goal_type: goalType, goal_text: goalText, goal_value: goalValue,
    start_weight: startWeight, start_body_fat: startBodyFat, start_measurements: startMeasurements,
  })
}
