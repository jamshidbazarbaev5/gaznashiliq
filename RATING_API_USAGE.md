# Rating API Implementation Guide

## Overview

This document explains how the rating system has been updated to use the API endpoint `api/responses/{response_id}/rate/` instead of storing ratings locally on the phone.

## API Endpoint

**Endpoint**: `POST /api/responses/{response_id}/rate/`
**Method**: POST
**Authentication**: Required (Bearer token)

### Request Body
```json
{
  "rating": 5
}
```

### Response
```json
{
  "id": 123,
  "rating": 5,
  "response_id": 456,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Implementation Details

### 1. Rating Service (`src/api/rating.ts`)

The new `RatingService` class provides methods to:
- Submit new ratings
- Update existing ratings
- Retrieve ratings (for future use)

```typescript
import { ratingService } from '../api';

// Submit a new rating
const response = await ratingService.submitRating(responseId, 5);

// Update existing rating
const updatedResponse = await ratingService.updateRating(responseId, 3);
```

### 2. ResponseModal Updates

The `ResponseModal` component now:
- Accepts a `responseId` prop
- Uses the API to submit/update ratings
- Falls back to local storage for offline scenarios
- Shows loading states and error messages

### 3. Data Flow

1. User opens response modal
2. System checks for existing rating via API
3. If API fails, falls back to local storage
4. User selects rating (1-5 stars)
5. On submit, rating is sent to API
6. Success: Rating saved both on server and locally
7. Error: Rating saved locally with sync message

### 4. Backward Compatibility

The system maintains backward compatibility by:
- Checking local storage if API call fails
- Saving ratings locally as backup
- Allowing offline rating that syncs when online

## Error Handling

The implementation includes comprehensive error handling:

- **Network errors**: Falls back to local storage
- **Invalid response ID**: Shows error message
- **Rating validation**: Ensures rating is 1-5
- **Authentication errors**: Handled by base API client

## Rating Scale

- **1-2**: Poor (Red color)
- **3**: Satisfactory (Yellow color)  
- **4**: Good (Blue color)
- **5**: Excellent (Green color)

## UI States

The rating interface shows different states:
- **Loading**: "Baholanmoqda..." / "Отправка оценки..." / "Bahalanıp atır..."
- **Success**: "✓ Sizning bahoyingiz saqlandi" / "✓ Ваша оценка сохранена" / "✓ Sizniń bahańız saqlandı"
- **Error**: Error message with fallback to local storage
- **Update**: Button text changes to "Update Rating" for existing ratings

## Integration Example

```typescript
// In AppealStatusScreen.tsx
<ResponseModal
  visible={responseModalVisible}
  onClose={() => setResponseModalVisible(false)}
  appealNumber={String(appealData.appealNumber || '')}
  appealId={String(appealId || '')}
  responseId={appealData.response?.id} // New prop
  responseText={String(responseText || t('common.no_response'))}
  responseFiles={appealData.response?.files || []}
  onFileDownload={handleFileDownload}
/>
```

## Testing

To test the rating system:

1. Ensure you have a response with a valid `response_id`
2. Open the response modal
3. Select a rating (1-5 stars)
4. Click "Rate" or "Update Rating"
5. Verify the API call is made to `/api/responses/{response_id}/rate/`
6. Check that the rating persists on app restart

## Migration Notes

- Existing local ratings will be preserved
- When users rate responses with local ratings, they'll be prompted to submit to API
- The system gracefully handles cases where response_id is not available
- All existing appeal data structures remain compatible

## Future Enhancements

- Sync local ratings to API when connection is restored
- Add rating statistics and analytics
- Implement rating retrieval for displaying user's past ratings
- Add bulk rating submission for offline-created ratings