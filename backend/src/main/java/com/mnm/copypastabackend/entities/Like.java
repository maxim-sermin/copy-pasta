package com.mnm.copypastabackend.entities;

import java.io.Serializable;
import java.util.Objects;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.EmbeddedId;
import javax.persistence.Entity;
import javax.persistence.Table;

import io.swagger.annotations.ApiModel;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "likes")
@ApiModel
public class Like {

    @EmbeddedId
    private LikeId id;

    @Embeddable
    public static class LikeId implements Serializable {
        @Column(name="recipe_fk")
        private Long recipeId;
        @Column(name="user_fk")
        private Long userId;

        public LikeId() {
        }

        public LikeId(Long recipeId, Long userId) {
            this.recipeId = recipeId;
            this.userId = userId;
        }

        public Long getRecipeId() {
            return recipeId;
        }

        public void setRecipeId(Long recipeId) {
            this.recipeId = recipeId;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) { return true; }
            if (!(o instanceof LikeId)) { return false; }
            LikeId likeId = (LikeId) o;
            return recipeId.equals(likeId.recipeId) && userId.equals(likeId.userId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(recipeId, userId);
        }
    }
}
