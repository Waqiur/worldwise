import { useEffect, useState } from "react";
import { useUrlPosition } from "../hooks/useUrlPosition";
import styles from "./Form.module.css";
import Button from "./Button";
import Message from "./Message";
import Spinner from "./Spinner";
import BackButton from "./BackButton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

export function convertToEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt());
    return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
}

const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
    const [cityName, setCityName] = useState("");
    const [country, setCountry] = useState("");
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [lat, lng] = useUrlPosition();
    const [geocodingError, setGeocodingError] = useState("");
    const { createCity, isLoading } = useCities();

    const navigate = useNavigate();
    const [emoji, setEmoji] = useState("");

    const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!cityName || !date) {
            return;
        }
        const newCity = {
            cityName,
            country,
            emoji,
            date,
            notes,
            position: { lat, lng },
        };
        await createCity(newCity);
        navigate("/app/cities");
    }

    useEffect(
        function () {
            if (!lat && !lng) return;
            async function fetchCityData() {
                try {
                    setIsLoadingGeocoding(true);
                    const res = await fetch(
                        `${BASE_URL}?latitude=${lat}&longitude=${lng}`
                    );
                    const data = await res.json();
                    if (!data.countryCode)
                        throw new Error(
                            "This is not a country. Click somewhere else🙂"
                        );
                    setCityName(data.city || data.locality || "");
                    setCountry(data.countryName);
                    setGeocodingError("");
                    setEmoji(convertToEmoji(data.countryCode));
                } catch (err) {
                    setGeocodingError(err.message);
                } finally {
                    setIsLoadingGeocoding(false);
                }
            }
            fetchCityData();
        },
        [lat, lng]
    );

    if (!lat && !lng)
        return <Message message={"Start by clicking somewhere on the map"} />;

    if (isLoadingGeocoding) return <Spinner />;

    if (geocodingError) return <Message message={geocodingError} />;

    return (
        <form
            className={`${styles.form} ${isLoading ? styles.loading : ""}`}
            onSubmit={handleSubmit}
        >
            <div className={styles.row}>
                <label htmlFor="cityName">City name</label>
                <input
                    id="cityName"
                    onChange={(e) => setCityName(e.target.value)}
                    value={cityName}
                />
                {emoji != "" && (
                    <img
                        className={styles.flag}
                        src={emoji}
                        alt={`${cityName} flag`}
                    />
                )}
            </div>

            <div className={styles.row}>
                <label htmlFor="date">When did you go to {cityName}?</label>
                <DatePicker
                    id="date"
                    onChange={(date) => setDate(date)}
                    selected={date}
                    dateFormat="dd/MM/yyyy"
                />
            </div>

            <div className={styles.row}>
                <label htmlFor="notes">
                    Notes about your trip to {cityName}
                </label>
                <textarea
                    id="notes"
                    onChange={(e) => setNotes(e.target.value)}
                    value={notes}
                />
            </div>

            <div className={styles.buttons}>
                <Button type="primary">Add</Button>
                <BackButton />
            </div>
        </form>
    );
}

export default Form;
