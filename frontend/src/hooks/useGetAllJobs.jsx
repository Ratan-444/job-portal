import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { setAllJobs } from '@/redux/jobSlice';
import { JOB_API_END_POINT } from '@/utils/constant';

const useGetAllJobs = () => {
  const dispatch = useDispatch();
  const { searchedQuery, token } = useSelector(store => store.job); // token from redux or localStorage

  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const res = await axios.get(
          `${JOB_API_END_POINT}/get?keyword=${searchedQuery}`,
          {
            headers: {
              Authorization: `Bearer ${token}`, // send token
            },
            withCredentials: true, // only if backend uses cookies
          }
        );

        if (res.data.success) {
          dispatch(setAllJobs(res.data.jobs));
        }
      } catch (error) {
        console.log('Error fetching jobs:', error.response || error.message);
      }
    };

    if (token) fetchAllJobs(); // only fetch if token exists
  }, [searchedQuery, token, dispatch]);
};

export default useGetAllJobs;
