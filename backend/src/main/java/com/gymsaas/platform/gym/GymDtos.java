package com.gymsaas.platform.gym;

public class GymDtos {

    public record GymProfileResponse(
            Long id,
            String name,
            String phone,
            String email,
            String address,
            String status,
            String planTier
    ) {
        public static GymProfileResponse from(Gym gym) {
            return new GymProfileResponse(
                    gym.getId(), gym.getName(), gym.getPhone(), gym.getEmail(),
                    gym.getAddress(), gym.getStatus().name(), gym.getPlanTier().name()
            );
        }
    }
}
