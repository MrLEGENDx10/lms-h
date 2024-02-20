import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../config/axiosInstance';
import { toast } from 'react-hot-toast';


const initialState = {
    lectures:[],
    currentLecture: localStorage.getItem('lastLecture') ? Number(localStorage.getItem('lastLecture')) : 0
}

export const getCourseLecture = createAsyncThunk( 'course/lecture/get' , async(courseId)=>{
    try {
        const response = axiosInstance.get(`/course/${courseId}`);
        toast.promise(response,{
            loading: 'Loading...',
            success: 'Lecture loaded',
            error: 'Error loading lecture'
        })  
        return (await response).data;
    } catch (error) {
        toast.error( error.response.data.message || 'Error loading lecture')
    }
});

export const addCourseLecture = createAsyncThunk('/course/lecture/add',async (data)=>{
    try {
        const formData = new FormData();
        formData.append('lecture', data.lecture);
        formData.append('title', data.title);
        formData.append('description', data.description);

        const response = axiosInstance.post(`/course/lecture/${data.courseId}`, formData);
        toast.promise(response,{
            loading: 'Loading...',
            success: 'Lecture added',
            error: 'Error adding lecture'
        })
        return (await response).data;
    } catch (error) {
        toast.error( error.response.data.message || 'Error adding lecture')
    }
});

export const deletecourseLecture  = createAsyncThunk('/course/lecture/delete', async (data)=>{
    try {
        console.log('courseId',data.courseId)
        console.log('lectureId',data.lectureId)
        const response = axiosInstance.delete(`/course/${data.courseId}/lectures/${data.lectureId}`);
        toast.promise(response,{
            loading: 'Loading...',
            success: 'Lecture deleted',
            error: 'Error deleting lecture'
        })
        return (await response).data;
    } catch (error) {
        toast.error( error.response.data.message || 'Error deleting lecture')
    }
});


const lectureSlice = createSlice({
    name: 'lecture',
    initialState,
    reducers:{
        setCurrentLecture: (state,action) =>{
            state.currentLecture = action.payload;
            localStorage.setItem('lastLecture', action.payload);
        }
    },
    extraReducers:(builder) => {
        builder
            .addCase(getCourseLecture.fulfilled, (state, action) => {
                state.lectures = action.payload?.data;
            })
            .addCase(addCourseLecture.fulfilled, (state, action) => {
                state.lectures.push(action.payload?.lecture);
            })
            .addCase(deletecourseLecture.fulfilled, (state, action) => {
                state.lectures = state.lectures.filter(lecture => lecture._id !== action.payload?.lectureId);
            })
    }
})

export const { setCurrentLecture } = lectureSlice.actions;

export default lectureSlice.reducer;