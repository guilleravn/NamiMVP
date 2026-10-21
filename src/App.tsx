import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { DevBar } from './components/DevMenu';
import { BuyerLayout } from './routes/buyer/BuyerLayout';
import { Home } from './routes/buyer/Home';
import { ListingDetail } from './routes/buyer/ListingDetail';
import { MyOrders } from './routes/buyer/MyOrders';
import { Pay } from './routes/buyer/Pay';
import { PickupCode } from './routes/buyer/PickupCode';
import { Rate } from './routes/buyer/Rate';
import { Landing } from './routes/Landing';
import { MissingPage } from './routes/MissingPage';
import { ListingForm } from './routes/restaurant/ListingForm';
import { RestaurantLayout } from './routes/restaurant/RestaurantLayout';
import { RestaurantOrders } from './routes/restaurant/RestaurantOrders';
import { Stats } from './routes/restaurant/Stats';
import { TodayListings } from './routes/restaurant/TodayListings';
import { StoreProvider } from './store/StoreProvider';

export function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <DevBar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/buyer" element={<BuyerLayout />}>
            <Route index element={<Home />} />
            <Route path="listing/:id" element={<ListingDetail />} />
            <Route path="order/:id/pay" element={<Pay />} />
            <Route path="order/:id" element={<PickupCode />} />
            <Route path="order/:id/rate" element={<Rate />} />
            <Route path="orders" element={<MyOrders />} />
          </Route>
          <Route path="/restaurant" element={<RestaurantLayout />}>
            <Route index element={<TodayListings />} />
            <Route path="new" element={<ListingForm />} />
            <Route path="listing/:id/edit" element={<ListingForm />} />
            <Route path="orders" element={<RestaurantOrders />} />
            <Route path="stats" element={<Stats />} />
          </Route>
          <Route
            path="*"
            element={
              <main id="main" className="mx-auto max-w-phone px-4">
                <MissingPage />
              </main>
            }
          />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}
