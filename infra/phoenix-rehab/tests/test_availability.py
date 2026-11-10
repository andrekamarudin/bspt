import asyncio
import unittest
from datetime import datetime,timedelta
from zoneinfo import ZoneInfo
from availability import _per_branch, validate_date
class DummyResponse:
    def __init__(self,url,data=None):self.url=url;self.data=data
    def raise_for_status(self):pass
    def json(self):return self.data
class DummyClient:
    def __init__(self,date):self.date=date
    async def get(self,url,**kwargs):
        if 'clinic-page' in str(url):
            return DummyResponse('https://el.hb.sgimed.com/#/online-booking?t='+'X'*180)
        payload={'date':self.date,'value':[{'online_booking_calendar':{'detail_json':{'name':'PHYSIO Ms Example'},'extra_values':{'doctor':{'nric':'FAKE-SENSITIVE-ID','date_of_birth':'1901-01-01','email':'private@example.org','mcr':'ID'}}},'available_blocks':[{'start_at':self.date+' 10:00','end_at':self.date+' 10:45','remaining':2,'appointment_types':[],'other_private':'SECRET'}]}]}
        return DummyResponse(str(url),payload)
class AvailabilitySafety(unittest.TestCase):
    def test_public_projection_excludes_sensitive_vendor_data(self):
        tomorrow=(datetime.now(ZoneInfo('Asia/Singapore')).date()+timedelta(days=1)).isoformat()
        slots,ok=asyncio.run(_per_branch(DummyClient(tomorrow),'Orchard','orchard',tomorrow))
        self.assertTrue(ok)
        self.assertEqual(len(slots),1)
        self.assertEqual(set(slots[0]),{'branch','service','start','end','minutes','remaining'})
        self.assertEqual(slots[0]['branch'],'Orchard')
        self.assertEqual(slots[0]['minutes'],45)
        self.assertNotIn('FAKE-SENSITIVE-ID',str(slots))
        self.assertNotIn('date_of_birth',str(slots))
        self.assertNotIn('private@example.org',str(slots))
    def test_date_bounds(self):
        today=datetime.now(ZoneInfo('Asia/Singapore')).date()
        self.assertEqual(validate_date(today.isoformat()),today.isoformat())
        with self.assertRaises(ValueError):validate_date((today-timedelta(days=1)).isoformat())
        with self.assertRaises(ValueError):validate_date((today+timedelta(days=35)).isoformat())
if __name__=='__main__':unittest.main()
