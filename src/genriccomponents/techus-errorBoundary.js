/**
  * Error boundry for site inconvinense state handling component.
  * @name ErrorBoundary
  * @param {any} value - The value to be string.
  * @returns {function} - The  value as a componet.
  * @version 1.0.0
 */


import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

// If application facing Inconvenience this alert prevent the errror user end.
const ErrorBoundary = ({ children }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleError = (error) => {
            // Catch errors in the component tree below
            setHasError(true);
            console.error('Error caught in ErrorBoundary:', error);
        };

        window.addEventListener('error', handleError);

        return () => {
            // Cleanup function to remove event listener
            window.removeEventListener('error', handleError);
        };
    }, []);

    const handleRetry = () => {
        setHasError(false);
    };

    if (hasError) {
        // Render the fallback UI using SweetAlert
        Swal.fire({
            title: 'Page Under Maintenance',
            text: 'Oops, something went wrong! This page is currently under maintenance.',
            // icon: 'info',
            confirmButtonText: 'Go Back to Previous Page',
            confirmButtonColor: '#3085d6',
        }).then((result) => {
            // If the user clicks "Retry", handleRetry will be called
            if (result.isConfirmed) {
                handleRetry();
            }
        });

        // Return null to prevent rendering of children when there's an error
        return null;
    }

    return children;
};

export default ErrorBoundary;
