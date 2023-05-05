import { Link, useParams } from "react-router-dom";
import AccountNav from "../AccountNav";
import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";
export default function PlacesPage(){

    const [places,setPlaces] = useState([]);
    useEffect(() => {
        axios.get('user-places').then(({data}) => {
            setPlaces(data);
        });
    }, []);

    return (
        <div>
            <AccountNav />

                <div className="text-center">
                <Link className="inline-flex gap-1 bg-primary text-white py-2 px-6 rounded-full" to={'/account/places/new'} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                    Add New Place
                </Link>
            </div>
            <div className="grid gap-4 mt-4">
                {places.length > 0 && places.map(place => (
                    <Link to={'/account/places/'+place._id} className=" cursor-pointer flex gap-4 bg-gray-100 p-4 rounded-2xl shadow shadow-gray-500">
                        <div className="flex w-32 h-32 bg-gray-300 grow shrink-0">
                            <PlaceImg place={place} />
                        </div>
                        <div className="grow-0 shrink">
                            <h2 className="text-xl">{place.title}</h2>
                            <p>{place.description}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}