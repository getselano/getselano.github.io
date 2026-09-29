/**
 * חיבור מערכת החתימה לאפליקציית האתגר.
 * להדביק בסוף קוד.gs, ובתוך submitAgreement, מיד אחרי השורה
 *   logRow_('הסכם', data, stamp, file.getUrl());
 * להוסיף:
 *   gripSync_(data, stamp, file.getUrl());
 *
 * Script properties (הגדרות הפרויקט ← מאפייני סקריפט):
 *   GRIP_URL            https://grip-challenge.netlify.app
 *   GRIP_INTAKE_SECRET  אותו ערך כמו INTAKE_SECRET ב-Netlify
 */
function gripSync_(d, stamp, url) {
  try {
    var props = PropertiesService.getScriptProperties();
    var res = UrlFetchApp.fetch(props.getProperty('GRIP_URL') + '/api/intake/signup', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + props.getProperty('GRIP_INTAKE_SECRET') },
      payload: JSON.stringify({
        fullName: d.fullName, idNumber: d.idNumber, phone: d.phone, email: d.email,
        address: d.address, birthDate: d.birthDate, startDate: d.startDate,
        price: d.price, payment: d.payment, photoConsent: d.photoConsent,
        needsMedical: d.needsMedical, isMinor: d.isMinor,
        parentName: d.parentName, parentId: d.parentId, parentPhone: d.parentPhone,
        signedAt: stamp, agreementUrl: url
      }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() >= 300) console.error('grip sync → ' + res.getResponseCode() + ': ' + res.getContentText());
  } catch (err) {
    // החתימה כבר נשמרה ונשלחה במייל; תקלה כאן לא מפילה אותה.
    console.error('grip sync failed: ' + err);
  }
}
